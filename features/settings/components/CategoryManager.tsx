import type { Category } from 'types'
import { Pencil, Plus, Trash2, X } from '@tamagui/lucide-icons'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, View as RNView } from 'react-native'
import { categoriesAtom } from 'store/category'
import { generateId } from 'utils/id'
import {
  Button,
  Input,
  Separator,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from 'tamagui'

// Hue wheel: 12 evenly-spaced hues at full saturation
function hueToHex(hue: number): string {
  const h = hue % 360
  const c = 255
  const x = Math.round(c * (1 - Math.abs(((h / 60) % 2) - 1)))
  const m = 0

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }

  const toHex = (v: number) => (v + m).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const SPECTRUM_HUES = Array.from({ length: 12 }, (_, i) => i * 30)

function generateVariations(baseHex: string): string[] {
  const r = Number.parseInt(baseHex.slice(1, 3), 16)
  const g = Number.parseInt(baseHex.slice(3, 5), 16)
  const b = Number.parseInt(baseHex.slice(5, 7), 16)

  // Generate 8 variations: 4 lightness levels × 2 saturation levels
  const variations: string[] = []
  for (let sat = 0; sat < 2; sat++) {
    for (let light = 0; light < 4; light++) {
      const factor = sat === 0 ? 1 : 0.5
      const lOffset = (light - 1.5) * 0.35
      const nr = Math.round(Math.min(255, Math.max(0, r * factor + lOffset * 255)))
      const ng = Math.round(Math.min(255, Math.max(0, g * factor + lOffset * 255)))
      const nb = Math.round(Math.min(255, Math.max(0, b * factor + lOffset * 255)))
      const hex = `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
      variations.push(hex)
    }
  }
  return variations
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex)
  if (!match) return null
  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  }
}

const DEFAULT_COLOR = '#2196F3'

export function CategoryManager() {
  const theme = useTheme()
  const [categories, setCategories] = useAtom(categoriesAtom)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formColor, setFormColor] = useState(DEFAULT_COLOR)
  const [formHex, setFormHex] = useState(DEFAULT_COLOR)
  const [formIcon, setFormIcon] = useState('')

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const openAddModal = (type: 'income' | 'expense') => {
    setEditingCategory(null)
    setFormName('')
    setFormType(type)
    setFormColor(DEFAULT_COLOR)
    setFormHex(DEFAULT_COLOR)
    setFormIcon('')
    setEditModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormType(cat.type)
    setFormColor(cat.color ?? DEFAULT_COLOR)
    setFormHex(cat.color ?? DEFAULT_COLOR)
    setFormIcon(cat.icon ?? '')
    setEditModalOpen(true)
  }

  const handleSave = () => {
    const trimmed = formName.trim()
    if (!trimmed) {
      Alert.alert('请输入分类名称')
      return
    }

    if (editingCategory) {
      setCategories(
        categories.map(c =>
          c.id === editingCategory.id
            ? { ...c, name: trimmed, type: formType, color: formColor, icon: formIcon || undefined }
            : c,
        ),
      )
    } else {
      const maxSort = categories
        .filter(c => c.type === formType)
        .reduce((max, c) => Math.max(max, c.sort), 0)

      const newCategory: Category = {
        id: generateId(),
        name: trimmed,
        type: formType,
        color: formColor,
        icon: formIcon || undefined,
        enabled: true,
        sort: maxSort + 1,
      }
      setCategories([...categories, newCategory])
    }

    setEditModalOpen(false)
  }

  const handleDelete = (cat: Category) => {
    Alert.alert(
      '删除分类',
      `确定删除「${cat.name}」？已有记账记录不受影响，将显示为未知分类。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => setCategories(categories.filter(c => c.id !== cat.id)),
        },
      ],
    )
  }

  const CategoryRow = ({ cat }: { cat: Category }) => (
    <XStack
      items="center"
      justify="space-between"
      bg="$backgroundHover"
      px="$3"
      py="$2.5"
      rounded="$3"
    >
      <XStack items="center" gap="$2" flex={1}>
        <RNView
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: cat.color ?? '#888',
          }}
        />
        <Text fontSize="$3" fontWeight="500">
          {cat.name}
        </Text>
      </XStack>
      <XStack gap="$1">
        <Button
          size="$2"
          chromeless
          onPress={() => openEditModal(cat)}
        >
          <Pencil size={14} color="$color10" />
        </Button>
        <Button
          size="$2"
          chromeless
          onPress={() => handleDelete(cat)}
        >
          <Trash2 size={14} color="#e74c3c" />
        </Button>
      </XStack>
    </XStack>
  )

  return (
    <YStack gap="$3">
      {/* Income Categories */}
      <YStack gap="$2">
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" fontWeight="600" color="$color10">
            收入分类
          </Text>
          <Button
            size="$2"
            icon={<Plus size={12} />}
            onPress={() => openAddModal('income')}
          >
            添加
          </Button>
        </XStack>
        {incomeCategories.length === 0
          ? (
              <Text fontSize="$2" color="$color10" py="$2" style={{ textAlign: 'center' }}>
                暂无收入分类
              </Text>
            )
          : (
              incomeCategories.map(cat => (
                <CategoryRow key={cat.id} cat={cat} />
              ))
            )}
      </YStack>

      <Separator />

      {/* Expense Categories */}
      <YStack gap="$2">
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" fontWeight="600" color="$color10">
            支出分类
          </Text>
          <Button
            size="$2"
            icon={<Plus size={12} />}
            onPress={() => openAddModal('expense')}
          >
            添加
          </Button>
        </XStack>
        {expenseCategories.length === 0
          ? (
              <Text fontSize="$2" color="$color10" py="$2" style={{ textAlign: 'center' }}>
                暂无支出分类
              </Text>
            )
          : (
              expenseCategories.map(cat => (
                <CategoryRow key={cat.id} cat={cat} />
              ))
            )}
      </YStack>

      {/* Add/Edit Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setEditModalOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.background?.val ?? '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              paddingBottom: 40,
              maxHeight: '85%',
            }}
            onPress={e => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Handle */}
              <View items="center" pb="$4">
                <View
                  width={40}
                  height={4}
                  rounded="$2"
                  bg="$backgroundPress"
                />
              </View>

              <YStack gap="$4">
                <XStack items="center" justify="space-between">
                  <Text fontSize="$5" fontWeight="700">
                    {editingCategory ? '编辑分类' : '添加分类'}
                  </Text>
                  <Button
                    size="$2"
                    chromeless
                    onPress={() => setEditModalOpen(false)}
                  >
                    <X size="$1" color="$color" />
                  </Button>
                </XStack>

                <YStack gap="$3">
                  {/* Type */}
                  <YStack gap="$1">
                    <Text fontSize="$3" fontWeight="500">类型</Text>
                    <XStack gap="$2">
                      <Button
                        flex={1}
                        size="$3"
                        bg={(formType === 'expense' ? '$red10' : '$backgroundHover') as any}
                        color={formType === 'expense' ? 'white' : '$color'}
                        onPress={() => setFormType('expense')}
                      >
                        支出
                      </Button>
                      <Button
                        flex={1}
                        size="$3"
                        bg={(formType === 'income' ? '$green10' : '$backgroundHover') as any}
                        color={formType === 'income' ? 'white' : '$color'}
                        onPress={() => setFormType('income')}
                      >
                        收入
                      </Button>
                    </XStack>
                  </YStack>

                  {/* Name */}
                  <YStack gap="$1">
                    <Text fontSize="$3" fontWeight="500">名称</Text>
                    <Input
                      placeholder="分类名称"
                      value={formName}
                      onChangeText={setFormName}
                    />
                  </YStack>

                  {/* Color */}
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500">颜色</Text>

                    {/* Hue spectrum bar */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <XStack gap={0}>
                        {SPECTRUM_HUES.map(hue => {
                          const color = hueToHex(hue)
                          return (
                            <Pressable
                              key={hue}
                              onPress={() => {
                                setFormColor(color)
                                setFormHex(color)
                              }}
                              style={{
                                width: 30,
                                height: 36,
                                backgroundColor: color,
                                borderWidth: formColor === color ? 3 : 0,
                                borderColor: theme.background?.val === '#fff' ? '#333' : '#fff',
                              }}
                            />
                          )
                        })}
                      </XStack>
                    </ScrollView>

                    {/* Variations for selected hue */}
                    <XStack gap="$2" flexWrap="wrap">
                      {generateVariations(formColor).map(color => (
                        <Pressable
                          key={color}
                          onPress={() => {
                            setFormColor(color)
                            setFormHex(color)
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: color,
                            borderWidth: formColor === color ? 3 : 0,
                            borderColor: theme.color?.val ?? '#333',
                          }}
                        />
                      ))}
                    </XStack>

                    {/* Hex input */}
                    <XStack items="center" gap="$2">
                      <Text fontSize="$2" color="$color10">#</Text>
                      <Input
                        flex={1}
                        placeholder="输入色值"
                        value={formHex.replace('#', '')}
                        maxLength={6}
                        onChangeText={(text) => {
                          const clean = text.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                          const hex = `#${clean}`
                          setFormHex(hex)
                          if (clean.length === 6 && hexToRgb(hex)) {
                            setFormColor(hex)
                          }
                        }}
                      />
                      <RNView
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: formColor,
                        }}
                      />
                    </XStack>
                  </YStack>

                  {/* Preview */}
                  <XStack
                    items="center"
                    gap="$2"
                    bg="$backgroundHover"
                    px="$3"
                    py="$2.5"
                    rounded="$3"
                  >
                    <RNView
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: formColor,
                      }}
                    />
                    <Text fontSize="$3">
                      {formName || '预览'}
                    </Text>
                  </XStack>

                  <Button
                    onPress={handleSave}
                    bg="$blue10"
                    color="white"
                  >
                    {editingCategory ? '保存修改' : '添加分类'}
                  </Button>
                </YStack>
              </YStack>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </YStack>
  )
}
