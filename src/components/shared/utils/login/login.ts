import { website_name } from '@/utils/site-config';
import { domain_app_ids, getAppId, getCurrentProductionDomain } from '../config/config';
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getStaticUrl, urlForCurrentDomain } from '../url';
import { deriv_urls } from '../url/constants';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);
        setTimeout(() => {
            const new_href = loginUrl({ language });
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    window.open(getStaticUrl('/signup/'));
};

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    const server_url = LocalStore.get('config.server_url');
    const signup_device_cookie = new (CookieStorage as any)('signup_device');
    const signup_device = signup_device_cookie.get('signup_device');
    const date_first_contact_cookie = new (CookieStorage as any)('date_first_contact');
    const date_first_contact = date_first_contact_cookie.get('date_first_contact');
    const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${
        date_first_contact ? `&date_first_contact=${date_first_contact}` : ''
    }`;
    
    // ⭐ ADD THIS: Get the current redirect URI
    const redirect_uri = `${window.location.origin}/callback`;
    const encoded_redirect_uri = encodeURIComponent(redirect_uri);
    
    const getOAuthUrl = () => {
        const current_domain = getCurrentProductionDomain();
        let oauth_domain = deriv_urls.DERIV_HOST_NAME;

        if (current_domain) {
            // Extract domain suffix (e.g., 'deriv.me' from 'dbot.deriv.me')
            const domain_suffix = current_domain.replace(/^[^.]+\./, '');
            oauth_domain = domain_suffix;
        }

        // ⭐ UPDATED: Added redirect_uri parameter
        const url = `https://oauth.${oauth_domain}/oauth2/authorize?app_id=${getAppId()}&l=${language}&redirect_uri=${encoded_redirect_uri}${marketing_queries}&brand=${website_name.toLowerCase()}`;
        return url;
    };

    if (server_url && /qa/.test(server_url)) {
        // ⭐ UPDATED: Added redirect_uri parameter for QA servers
        return `https://${server_url}/oauth2/authorize?app_id=${getAppId()}&l=${language}&redirect_uri=${encoded_redirect_uri}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    }

    // ⭐ FIXED: Convert getAppId() to number for comparison, or compare as strings
    const current_app_id = getAppId();
    const domain_app_id = domain_app_ids[window.location.hostname as keyof typeof domain_app_ids];
    
    if (domain_app_id && current_app_id === String(domain_app_id)) {
        return getOAuthUrl();
    }
    return urlForCurrentDomain(getOAuthUrl());
};