// Frontend configuration file.
// Set PREPMATE_API_BASE before loading this file for a custom deployment URL.

const localHosts = ['localhost', '127.0.0.1'];
const isLocalFrontend = localHosts.includes(window.location.hostname);
const productionApiBase = window.PREPMATE_API_BASE || 'https://ai-interview-project-74tfatk0b-rudrashivani95-labs-projects.vercel.app';

window.API_BASE = window.API_BASE || (
	isLocalFrontend ? 'http://127.0.0.1:3000' : productionApiBase
);
