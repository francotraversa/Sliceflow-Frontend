import './style.css'
import { authService } from './api/authServices'
import { stockService } from './api/stockServices'
import { productionService } from './api/productionServices'
import { connectSocket } from './api/socket';
import { handleUnauthorized } from './api/client';

// Importamos las vistas
import { renderLogin } from './views/loginView';
import { renderDashboard } from './views/dashboardView';
import { renderProduction } from './views/productionView';

let currentView: 'stock' | 'production' = 'stock';
const app = document.querySelector<HTMLDivElement>('#app')!;

const startApp = async () => {
  if (authService.isAuthenticated()) {
    try {
      const data = await stockService.getDashboard();
      renderDashboard(data, app);

      // WebSocket Inteligente
      connectSocket(async () => {
        console.log(`🔄 Cambio detectado. Refrescando vista: ${currentView}`);

        if (currentView === 'production') {
          const prodData = await productionService.getProductionDashboard();
          renderProduction(app, prodData);
        } else {
          const stockData = await stockService.getDashboard();
          renderDashboard(stockData, app);
        }
      });
    } catch (error: any) {
      // 401 → token expired, go back to login
      if (error?.message?.includes('401') || error?.message?.includes('expirada')) {
        handleUnauthorized();
        return;
      }
      console.error('Error en la carga inicial:', error);
      renderLogin('Tu sesión expiró. Iniciá sesión nuevamente.', app);
    }
  } else {
    renderLogin(null, app);
  }
};

document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;

  if (target.id === 'btn-i3d') {
    currentView = 'production';
    const data = await productionService.getProductionDashboard();
    renderProduction(app, data);
  }

  if (target.id === 'btn-stock') {
    currentView = 'stock';
    const data = await stockService.getDashboard();
    renderDashboard(data, app);
  }
});

startApp();