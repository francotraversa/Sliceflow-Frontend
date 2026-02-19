import './style.css'
import { authService } from './api/authServices'
import { stockService } from './api/stockServices'
import { productionService } from './api/productionServices' // Agregamos este
import { connectSocket } from './api/socket';

// Importamos las vistas
import { renderLogin } from './views/loginView';
import { renderDashboard } from './views/dashboardView';
import { renderProduction } from './views/productionView'; // Agregamos este

let currentView: 'stock' | 'production' = 'stock';
const app = document.querySelector<HTMLDivElement>('#app')!;

const startApp = async () => {
  if (authService.isAuthenticated()) {
    try {
      // Carga inicial (Stock por defecto)
      const data = await stockService.getDashboard();
      renderDashboard(data, app);
      
      // WebSocket Inteligente
      connectSocket(async () => {
        console.log(`🔄 Cambio detectado. Refrescando vista: ${currentView}`);
        
        if (currentView === 'production') {
          // Si estás en I3D, refrescamos el radar de producción
          const prodData = await productionService.getProductionDashboard();
          renderProduction(app, prodData);
        } else {
          // Si estás en Stock, refrescamos el dashboard general
          const stockData = await stockService.getDashboard();
          renderDashboard(stockData, app);
        }
      });
    } catch (error) {
      console.error("Error en la carga inicial:", error);
      renderDashboard({ total_items: 0, total_value: 0, low_stock_count: 0, movements_today: 0 }, app);
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