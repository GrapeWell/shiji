import type { GetProps } from 'tamagui'
import { forwardRef, useState } from 'react'
import { Input, View, XStack } from 'tamagui'

type BaseInputProps = GetProps<typeof Input>
type StackProps = GetProps<typeof XStack>

interface IconInputProps extends Omit<BaseInputProps, 'children' | 'animation' | 'animateOnly'> {
  animation?: StackProps['animation']
  animateOnly?: StackProps['animateOnly']
  hasError?: boolean
  leftAccessory?: React.ReactNode
  leftIcon?: React.ReactNode
  rightAccessory?: React.ReactNode
}

export const IconInput = forwardRef<React.ElementRef<typeof Input>, IconInputProps>(
  ({
    hasError = false,
    leftAccessory,
    leftIcon,
    rightAccessory,
    onBlur,
    onFocus,
    animation,
    animateOnly,
    ...inputProps
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const borderColor = hasError ? 'red' : isFocused ? '$color8' : '$borderColor'

    return (
      <XStack
        width="100%"
        items="center"
        gap="$2"
        px="$3"
        bg="$background"
        borderWidth={1}
        borderColor={borderColor}
        rounded="$4"
        animation={animation}
        animateOnly={animateOnly ?? ['borderColor']}
      >
        {leftIcon && (
          <View opacity={0.72}>
            {leftIcon}
          </View>
        )}

        {leftAccessory && <View>{leftAccessory}</View>}

        <Input
          ref={ref}
          unstyled
          flex={1}
          px={0}
          py="$3"
          bg="transparent"
          onFocus={(event) => {
            setIsFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setIsFocused(false)
            onBlur?.(event)
          }}
          {...inputProps}
        />

        {rightAccessory && <View>{rightAccessory}</View>}
      </XStack>
    )
  },
)

IconInput.displayName = 'IconInput'
