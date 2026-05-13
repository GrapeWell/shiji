import type { Category, ExpenseRecord, WorkRecord } from 'types'
import { Plus, Trash2, X } from '@tamagui/lucide-icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, View as RNView } from 'react-native'
import { generateId } from 'utils/id'
import {
  Button,
  Input,
  Separator,
  Text,
  TextArea,
  View,
  XStack,
  YStack,
  useTheme,
} from 'tamagui'

interface Props {
  date: string
  workRecords: WorkRecord[]
  expenseRecords: ExpenseRecord[]
  categories: Category[]
  onAddWorkRecord: (record: WorkRecord) => void
  onDeleteWorkRecord: (id: string) => void
  onAddExpenseRecord: (record: ExpenseRecord) => void
  onDeleteExpenseRecord: (id: string) => void
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

export function DateDetailPanel({
  date,
  workRecords,
  expenseRecords,
  categories,
  onAddWorkRecord,
  onDeleteWorkRecord,
  onAddExpenseRecord,
  onDeleteExpenseRecord,
}: Props) {
  const [modalMode, setModalMode] = useState<'work' | 'expense' | null>(null)
  const theme = useTheme()

  // Work form state
  const [workDuration, setWorkDuration] = useState('')
  const [workNote, setWorkNote] = useState('')

  // Expense form state
  const [expenseType, setExpenseType] = useState<'income' | 'expense'>('expense')
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseNote, setExpenseNote] = useState('')

  const filteredCategories = categories.filter(
    c => c.type === expenseType && c.enabled,
  )

  const openModal = (mode: 'work' | 'expense') => {
    setModalMode(mode)
    if (mode === 'work') {
      setWorkDuration('')
      setWorkNote('')
    } else {
      setExpenseType('expense')
      const firstCat = categories.filter(c => c.type === 'expense' && c.enabled)[0]
      setExpenseCategoryId(firstCat?.id ?? '')
      setExpenseAmount('')
      setExpenseNote('')
    }
  }

  const handleAddWork = () => {
    const duration = Number.parseFloat(workDuration)
    if (Number.isNaN(duration) || duration <= 0 || duration > 24) {
      Alert.alert('请输入有效的工时（0-24小时）')
      return
    }

    const now = Date.now()
    onAddWorkRecord({
      id: generateId(),
      date,
      durationHours: duration,
      note: workNote || undefined,
      createdAt: now,
      updatedAt: now,
    })

    setModalMode(null)
  }

  const handleAddExpense = () => {
    const amount = Number.parseFloat(expenseAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('请输入有效的金额')
      return
    }
    if (!expenseCategoryId) {
      Alert.alert('请选择分类')
      return
    }

    const now = Date.now()
    onAddExpenseRecord({
      id: generateId(),
      date,
      type: expenseType,
      categoryId: expenseCategoryId,
      amount,
      note: expenseNote || undefined,
      createdAt: now,
      updatedAt: now,
    })

    setModalMode(null)
  }

  const handleDeleteWork = (id: string) => {
    Alert.alert('删除工时记录', '确定删除？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => onDeleteWorkRecord(id) },
    ])
  }

  const handleDeleteExpense = (id: string) => {
    Alert.alert('删除记账记录', '确定删除？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => onDeleteExpenseRecord(id) },
    ])
  }

  const totalIncome = expenseRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalExpense = expenseRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <YStack flex={1}>
      {/* Fixed Header */}
      <YStack px="$4" pt="$4" gap="$3">
        <Separator />

        <XStack items="center" justify="space-between">
          <Text fontSize="$5" fontWeight="700">
            {dayjs(date).format('M月D日')} 记录
          </Text>
          <Text fontSize="$3" color="$color10">
            收入 ¥{totalIncome.toFixed(2)} · 支出 ¥{totalExpense.toFixed(2)}
          </Text>
        </XStack>
      </YStack>

      {/* Scrollable Records */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack px="$4" gap="$4" pt="$3" pb="$2">
          {/* Work Records */}
          {workRecords.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color10">
                工时记录
              </Text>
              {workRecords.map(record => (
                <XStack
                  key={record.id}
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
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#2196F3',
                      }}
                    />
                    <YStack gap={2}>
                      <Text fontSize="$3" fontWeight="500">
                        {formatDuration(record.durationHours)}
                      </Text>
                      {record.note && (
                        <Text fontSize="$2" color="$color10">
                          {record.note}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                  <Button
                    size="$2"
                    chromeless
                    onPress={() => handleDeleteWork(record.id)}
                  >
                    <Trash2 size={14} color="#e74c3c" />
                  </Button>
                </XStack>
              ))}
            </YStack>
          )}

          {/* Expense Records */}
          {expenseRecords.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color10">
                记账记录
              </Text>
              {expenseRecords.map(record => {
                const cat = categories.find(c => c.id === record.categoryId)
                return (
                  <XStack
                    key={record.id}
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
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: cat?.color ?? '#888',
                        }}
                      />
                      <Text fontSize="$3" fontWeight="500">
                        {cat?.name ?? record.categoryId}
                      </Text>
                      {record.note && (
                        <Text fontSize="$2" color="$color10" numberOfLines={1}>
                          {record.note}
                        </Text>
                      )}
                    </XStack>
                    <XStack items="center" gap="$2">
                      <Text
                        fontSize="$3"
                        fontWeight="600"
                        color={record.type === 'income' ? '$green10' : '$red10'}
                      >
                        {record.type === 'income' ? '+' : '-'}¥{record.amount.toFixed(2)}
                      </Text>
                      <Button
                        size="$2"
                        chromeless
                        onPress={() => handleDeleteExpense(record.id)}
                      >
                        <Trash2 size={14} color="#e74c3c" />
                      </Button>
                    </XStack>
                  </XStack>
                )
              })}
            </YStack>
          )}

          {/* Empty state */}
          {workRecords.length === 0 && expenseRecords.length === 0 && (
            <YStack items="center" py="$6" gap="$1">
              <Text fontSize="$3" color="$color10">
                暂无记录
              </Text>
              <Text fontSize="$2" color="$color10">
                点击下方按钮添加
              </Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Fixed Footer */}
      <XStack px="$4" py="$3" gap="$3">
        <Button
          flex={1}
          size="$3"
          icon={<Plus size="$1" />}
          onPress={() => openModal('work')}
        >
          添加工时
        </Button>
        <Button
          flex={1}
          size="$3"
          icon={<Plus size="$1" />}
          onPress={() => openModal('expense')}
        >
          添加记账
        </Button>
      </XStack>

      {/* Add Record Modal */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalMode(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setModalMode(null)}
        >
          <Pressable
            style={{
              backgroundColor: theme.background?.val ?? '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              paddingBottom: 40,
              maxHeight: '80%',
            }}
            onPress={e => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close handle */}
              <View items="center" pb="$4">
                <View
                  width={40}
                  height={4}
                  rounded="$2"
                  bg="$backgroundPress"
                />
              </View>

              {modalMode === 'work' && (
                <YStack gap="$4">
                  <XStack items="center" justify="space-between">
                    <Text fontSize="$5" fontWeight="700">
                      添加工时记录
                    </Text>
                    <Button
                      size="$2"
                      chromeless
                      onPress={() => setModalMode(null)}
                    >
                      <X size="$1" color="$color" />
                    </Button>
                  </XStack>
                  <YStack gap="$3">
                    <YStack gap="$1">
                      <Text fontSize="$3" fontWeight="500">工时（小时）</Text>
                      <Input
                        placeholder="例如 8.5 表示 8小时30分钟"
                        keyboardType="decimal-pad"
                        value={workDuration}
                        onChangeText={setWorkDuration}
                      />
                    </YStack>
                    <YStack gap="$1">
                      <Text fontSize="$3" fontWeight="500">备注</Text>
                      <TextArea
                        placeholder="可选备注"
                        value={workNote}
                        onChangeText={setWorkNote}
                        numberOfLines={3}
                      />
                    </YStack>
                    <Button onPress={handleAddWork} bg="$blue10" color="white">
                      保存工时
                    </Button>
                  </YStack>
                </YStack>
              )}

              {modalMode === 'expense' && (
                <YStack gap="$4">
                  <XStack items="center" justify="space-between">
                    <Text fontSize="$5" fontWeight="700">
                      添加记账记录
                    </Text>
                    <Button
                      size="$2"
                      chromeless
                      onPress={() => setModalMode(null)}
                    >
                      <X size="$1" color="$color" />
                    </Button>
                  </XStack>
                  <YStack gap="$3">
                    {/* Type toggle */}
                    <XStack gap="$2">
                      <Button
                        flex={1}
                        size="$3"
                        bg={(expenseType === 'expense' ? '$red10' : '$backgroundHover') as any}
                        color={expenseType === 'expense' ? 'white' : '$color'}
                        onPress={() => {
                          setExpenseType('expense')
                          setExpenseCategoryId(
                            categories.find(c => c.type === 'expense' && c.enabled)?.id ?? '',
                          )
                        }}
                      >
                        支出
                      </Button>
                      <Button
                        flex={1}
                        size="$3"
                        bg={(expenseType === 'income' ? '$green10' : '$backgroundHover') as any}
                        color={expenseType === 'income' ? 'white' : '$color'}
                        onPress={() => {
                          setExpenseType('income')
                          setExpenseCategoryId(
                            categories.find(c => c.type === 'income' && c.enabled)?.id ?? '',
                          )
                        }}
                      >
                        收入
                      </Button>
                    </XStack>

                    {/* Category */}
                    <YStack gap="$1">
                      <Text fontSize="$3" fontWeight="500">分类</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <XStack gap="$2">
                          {filteredCategories.map(cat => (
                            <Button
                              key={cat.id}
                              size="$3"
                              bg={(expenseCategoryId === cat.id ? '$blue10' : '$backgroundHover') as any}
                              color={expenseCategoryId === cat.id ? 'white' : '$color'}
                              onPress={() => setExpenseCategoryId(cat.id)}
                            >
                              {cat.name}
                            </Button>
                          ))}
                        </XStack>
                      </ScrollView>
                    </YStack>

                    {/* Amount */}
                    <YStack gap="$1">
                      <Text fontSize="$3" fontWeight="500">金额</Text>
                      <Input
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={expenseAmount}
                        onChangeText={setExpenseAmount}
                      />
                    </YStack>

                    {/* Note */}
                    <YStack gap="$1">
                      <Text fontSize="$3" fontWeight="500">备注</Text>
                      <TextArea
                        placeholder="可选备注"
                        value={expenseNote}
                        onChangeText={setExpenseNote}
                        numberOfLines={3}
                      />
                    </YStack>

                    <Button
                      onPress={handleAddExpense}
                      bg={(expenseType === 'expense' ? '$red10' : '$green10') as any}
                      color="white"
                    >
                      保存记账
                    </Button>
                  </YStack>
                </YStack>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </YStack>
  )
}
