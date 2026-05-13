import type { AppSettings } from 'types'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Alert, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { settingsAtom } from 'store/settings'
import { Button, Input, Separator, Text, View, XStack, YStack } from 'tamagui'
import { CategoryManager } from './CategoryManager'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const [settings, setSettings] = useAtom(settingsAtom)
  const [hourlyRateText, setHourlyRateText] = useState(
    String(settings.defaultHourlyRate),
  )

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value }
    settingsAtom.onMount
    setSettings(next)
  }

  const handleHourlyRateBlur = () => {
    const val = Number.parseFloat(hourlyRateText)
    if (Number.isNaN(val) || val <= 0) {
      Alert.alert('请输入有效的时薪')
      setHourlyRateText(String(settings.defaultHourlyRate))
      return
    }
    setSettings({ ...settings, defaultHourlyRate: val })
  }

  return (
    <View flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <XStack
          items="center"
          px="$4"
          pt={insets.top + 16}
          pb="$4"
        >
          <Text fontSize="$6" fontWeight="700">
            设置
          </Text>
        </XStack>

        {/* Default Hourly Rate */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            默认时薪
          </Text>
          <XStack
            bg="$backgroundHover"
            rounded="$4"
            px="$4"
            py="$3.5"
            items="center"
            justify="space-between"
          >
            <Text fontSize="$3" color="$color10">
              每小时
            </Text>
            <XStack items="center" gap="$2">
              <Text fontSize="$3" color="$color10">
                {settings.currency === 'CNY' ? '¥' : '$'}
              </Text>
              <Input
                width={100}
                keyboardType="decimal-pad"
                value={hourlyRateText}
                onChangeText={setHourlyRateText}
                onBlur={handleHourlyRateBlur}
                style={{ textAlign: 'right' }}
              />
            </XStack>
          </XStack>
        </YStack>

        {/* Currency */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            货币单位
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              size="$3"
              bg={(settings.currency === 'CNY' ? '$blue10' : '$backgroundHover') as any}
              color={settings.currency === 'CNY' ? 'white' : '$color'}
              onPress={() => setSettings({ ...settings, currency: 'CNY' })}
            >
              CNY (¥)
            </Button>
            <Button
              flex={1}
              size="$3"
              bg={(settings.currency === 'USD' ? '$blue10' : '$backgroundHover') as any}
              color={settings.currency === 'USD' ? 'white' : '$color'}
              onPress={() => setSettings({ ...settings, currency: 'USD' })}
            >
              USD ($)
            </Button>
          </XStack>
        </YStack>

        {/* Week Start */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            周起始日
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              size="$3"
              bg={(settings.weekStart === 1 ? '$blue10' : '$backgroundHover') as any}
              color={settings.weekStart === 1 ? 'white' : '$color'}
              onPress={() => setSettings({ ...settings, weekStart: 1 })}
            >
              周一
            </Button>
            <Button
              flex={1}
              size="$3"
              bg={(settings.weekStart === 0 ? '$blue10' : '$backgroundHover') as any}
              color={settings.weekStart === 0 ? 'white' : '$color'}
              onPress={() => setSettings({ ...settings, weekStart: 0 })}
            >
              周日
            </Button>
          </XStack>
        </YStack>

        {/* Category Management */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            记账分类管理
          </Text>
          <Text fontSize="$2" color="$color10">
            删除分类不会影响已有的记账记录
          </Text>
          <CategoryManager />
        </YStack>

        <YStack px="$4" pb="$8">
          <Separator />
        </YStack>
      </ScrollView>
    </View>
  )
}
