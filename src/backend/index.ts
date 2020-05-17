import { createApp } from './app';
import { getConfig } from './config';

const { port } = getConfig();
const app = createApp(port);
app.listen(port, () => console.log(`app listening at http://localhost:${port}`));
