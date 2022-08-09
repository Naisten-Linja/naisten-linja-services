process.env.TZ = 'UTC'; // Set the backend application to use UTC time everywhere.
import { getConfig } from './backend/config';
import { createApp } from './backend/app';

const { port } = getConfig();
const app = createApp();
app.listen(port, () => console.log(`Backend app listening at http://localhost:${port}`));
