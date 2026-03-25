import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';
import { BrowserRouter } from 'react-router-dom';

// All the providers that the app uses
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <StoreProvider>
                    <BrowserRouter>
                        {children}
                    </BrowserRouter>
                </StoreProvider>
            </AuthProvider>
        </LanguageProvider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
