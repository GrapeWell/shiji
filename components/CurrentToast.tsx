import { AlertTriangle, Check, ShieldAlert, X } from '@tamagui/lucide-icons'
import { Toast, useToastController, useToastState } from '@tamagui/toast'
import { useEffect } from 'react'
import { isWeb, XStack } from 'tamagui'

interface ToastBridgeApi {
  show: (title: string, message?: string) => void
  hide: () => void
}

let toastBridgeApi: ToastBridgeApi | null = null

export function showToast(title: string, options?: { type: string }) {
  toastBridgeApi?.show(title, options?.type)
}

export function hideToast() {
  toastBridgeApi?.hide()
}

export function ToastBridge() {
  const toast = useToastController()

  useEffect(() => {
    toastBridgeApi = {
      show: (title: string, type?: string) => {
        toast.show(title, { type })
      },
      hide: () => {
        toast.hide()
      },
    }

    return () => {
      toastBridgeApi = null
    }
  }, [toast])

  return null
}

export function CurrentToast() {
  const currentToast = useToastState()
  if (!currentToast || currentToast.isHandledNatively)
    return null

  const icons = {
    error: <AlertTriangle size="$1" color="#ff4d4f" />,
    success: <Check size="$1" color="#52c41a" />,
    warning: <ShieldAlert size="$1" color="#faad14" />,
  }

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={isWeb ? '$12' : 0}
      rounded="$4"
      animation="quick"
      bg="$background"
    >
      <XStack items="center" justify="space-between" p="$1" gap="$4">
        {icons[currentToast.type]}
        <Toast.Title>{currentToast.title}</Toast.Title>
        <Toast.Close>
          <X
            size="$1"
          />
        </Toast.Close>
      </XStack>
    </Toast>
  )
}
