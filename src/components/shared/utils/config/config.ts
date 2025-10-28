import { LocalStorageConstants, LocalStorageUtils, URLUtils } from '@deriv-com/utils';

export const APP_IDS = {
    LOCALHOST: 36300,
    TMP_STAGING: 64584,
    STAGING: 29934,
    STAGING_BE: 29934,
    STAGING_ME: 29934,
    PRODUCTION: 65555,
    PRODUCTION_BE: 65556,
    PRODUCTION_ME: 65557,
};

export const livechat_license_id = 12049137;
export const livechat_client_id = '66aa088aad5a414484c1fd1fa8a5ace7';

export const domain_app_ids = {
    'master.bot-standalone.pages.dev': APP_IDS.TMP_STAGING,
    'staging-dbot.deriv.com': APP_IDS.STAGING,
    'staging-dbot.deriv.be': APP_IDS.STAGING_BE,
    'staging-dbot.deriv.me': APP_IDS.STAGING_ME,
    'dbot.deriv.com': APP_IDS.PRODUCTION,
    'dbot.deriv.be': APP_IDS.PRODUCTION_BE,
    'dbot.deriv.me': APP_IDS.PRODUCTION_ME,
};

export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain);

export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\\.)?${domain.replace('.', '\\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const isTestLink = () => {
    return (
        window.location.origin?.includes('.binary.sx') ||
        window.location.origin?.includes('bot-65f.pages.dev') ||
        isLocal()
    );
};

export const isLocal = () => /localhost(:\d+)?$/i.test(window.location.hostname);

// ⭐ REPLACED FUNCTION 1
export const getDefaultAppIdAndUrl = () => {
    return {
        app_id: '107518',
        server_url: 'ws.derivws.com',
    };
};

// ⭐ REPLACED FUNCTION 2
export const getAppId = (): string => {
    // Priority: Environment variable > localStorage > default
    const env_app_id = process.env.APP_ID;
    const stored_app_id = localStorage.getItem(LocalStorageConstants.configAppId);
    
    if (env_app_id) return env_app_id;
    if (stored_app_id) return stored_app_id;
    
    // Fallback to your App ID
    return '107518';
};

// ⭐ REPLACED FUNCTION 3
export const getSocketURL = (): string => {
    const stored_server = localStorage.getItem(LocalStorageConstants.configServerURL);
    
    if (stored_server) return stored_server;
    
    // Default to Deriv production WebSocket server
    return 'ws.derivws.com';
};

export const checkAndSetEndpointFromUrl = () => {
    if (isTestLink()) {
        const url_params = new URLSearchParams(location.search.slice(1));

        if (url_params.has('qa_server') && url_params.has('app_id')) {
            const qa_server = url_params.get('qa_server') || '';
            const app_id = url_params.get('app_id') || '';

            url_params.delete('qa_server');
            url_params.delete('app_id');

            if (/^(^(www\.)?qa[0-9]{1,4}\.deriv.dev|(.*)\.derivws\.com)$/.test(qa_server) && /^[0-9]+$/.test(app_id)) {
                localStorage.setItem('config.app_id', app_id);
                localStorage.setItem('config.server_url', qa_server.replace(/"/g, ''));
            }

            const params = url_params.toString();
            const hash = location.hash;

            location.href = `${location.protocol}//${location.hostname}${location.pathname}${
                params ? `?${params}` : ''
            }${hash || ''}`;

            return true;
        }
    }

    return false;
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};

export const generateOAuthURL = () => {
    const { getOauthURL } = URLUtils;
    const oauth_url = getOauthURL();
    const original_url = new URL(oauth_url);
    const hostname = window.location.hostname;

    // First priority: Check for configured server URLs (for QA/testing environments)
    const configured_server_url = (LocalStorageUtils.getValue(LocalStorageConstants.configServerURL) ||
        localStorage.getItem('config.server_url')) as string;

    const valid_server_urls = ['green.derivws.com', 'red.derivws.com', 'blue.derivws.com', 'canary.derivws.com'];

    if (
        configured_server_url &&
        (typeof configured_server_url === 'string'
            ? !valid_server_urls.includes(configured_server_url)
            : !valid_server_urls.includes(JSON.stringify(configured_server_url)))
    ) {
        original_url.hostname = configured_server_url;
    } else if (original_url.hostname.includes('oauth.deriv.')) {
        // Second priority: Domain-based OAuth URL setting for .me and .be domains
        if (hostname.includes('.deriv.me')) {
            original_url.hostname = 'oauth.deriv.me';
        } else if (hostname.includes('.deriv.be')) {
            original_url.hostname = 'oauth.deriv.be';
        } else {
            // Fallback to original logic for other domains
            const current_domain = getCurrentProductionDomain();
            if (current_domain) {
                const domain_suffix = current_domain.replace(/^[^.]+\./, '');
                original_url.hostname = `oauth.${domain_suffix}`;
            }
        }
    }
    return original_url.toString() || oauth_url;
};