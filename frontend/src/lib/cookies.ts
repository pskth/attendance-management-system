// Safe wrapper for js-cookie that works with SSR
// This prevents js-cookie from loading on the server where localStorage doesn't exist

const Cookies = {
    get: (key: string): string | undefined => {
        if (typeof window === 'undefined') return undefined;

        // Manually parse cookies on client side without importing js-cookie during SSR
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${key}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
        }
        return undefined;
    },

    set: (key: string, value: string, options?: any) => {
        if (typeof window === 'undefined') return;

        let cookieString = `${key}=${value}`;

        if (options?.expires) {
            const date = typeof options.expires === 'number'
                ? new Date(Date.now() + options.expires * 864e5)
                : options.expires;
            cookieString += `; expires=${date.toUTCString()}`;
        }

        if (options?.path) {
            cookieString += `; path=${options.path}`;
        } else {
            cookieString += '; path=/';
        }

        if (options?.domain) {
            cookieString += `; domain=${options.domain}`;
        }

        if (options?.secure) {
            cookieString += '; secure';
        }

        if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
        }

        document.cookie = cookieString;
    },

    remove: (key: string, options?: any) => {
        if (typeof window === 'undefined') return;

        Cookies.set(key, '', {
            ...options,
            expires: new Date(0)
        });
    },
};

export default Cookies;
