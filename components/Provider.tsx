import type { TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { useColorScheme } from 'react-native'
import { store } from 'store'
import { TamaguiProvider } from 'tamagui'
import { config } from '../tamagui.config'
import { CurrentToast, ToastBridge } from './CurrentToast'

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>) {
  const colorScheme = useColorScheme()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60,
      },
    },
  })

  return (
    <JotaiProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider
          config={config}
          defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
          {...rest}
        >
          <ToastProvider
            swipeDirection="horizontal"
            duration={6000}
            native={
              [
              // uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go
              // 'mobile'
              ]
            }
          >
            {children}
            <CurrentToast />
            <ToastBridge />
            <ToastViewport top="$8" left={0} right={0} />
          </ToastProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </JotaiProvider>
  )
}
