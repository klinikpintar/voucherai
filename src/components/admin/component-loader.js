import { ComponentLoader } from 'adminjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentLoader = new ComponentLoader();

const DEFAULT_DASHBOARD_COMPONENT = 'Dashboard';

// Add the dashboard component
const dashboardComponent = componentLoader.add(
  DEFAULT_DASHBOARD_COMPONENT,
  join(__dirname, './dashboard/voucher-stats.component.jsx')
);

export { componentLoader, dashboardComponent };
