import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber'
import { Toast } from 'primereact/toast'
import { ToggleButton } from 'primereact/togglebutton'
import { useRef, useState } from 'react'

import { useRouter } from 'next/navigation'
import { useLocalStorage } from 'primereact/hooks'

type PaymentDialogProps = {
    visible: boolean
    setVisible: (visible: boolean) => void
    totalAmount: number
    setAmountPaid: (amount: number) => void
    amountPaid: number
}

export default function PaymentDialog({
    visible,
    setVisible,
    totalAmount,
    setAmountPaid,
    amountPaid
}: PaymentDialogProps) {
    const [checked, setChecked] = useState(true)
    const toast = useRef<Toast>(null)
    const [amountPaidState, setAmountPaidState] = useState(0)
    const router = useRouter()
    const [, setAmountPaidLocal] = useLocalStorage<number>(0, 'amountPaid')
    const onSetAmountPaid = (e: InputNumberValueChangeEvent) => {
        setAmountPaidState(e.value ?? 0)
    }

    const onHide = () => {
        setVisible(false)

        setAmountPaidState(0)
    }

    const onSave = () => {
        if (amountPaidState < totalAmount) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Amount paid cannot be less than the total amount',
                life: 3000
            })
            return
        }
        setAmountPaid(amountPaidState)
        toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment saved successfully',
            life: 3000
        })
        setTimeout(() => {
            onHide()
        }, 500)
    }

    const onTransfer = () => {
        setChecked(false)
        setAmountPaidLocal(totalAmount)
        router.push('/admin/checkout')
    }

    return (
        <Dialog
            header='Payment Summary'
            style={{ width: '40vw', marginLeft: '15vw' }}
            visible={visible}
            modal
            draggable={false}
            onHide={onHide}
        >
            <Toast ref={toast} />
            <div className='flex flex-col gap-4 px-4'>
                <div className='flex justify-between items-center gap-2'>
                    <div className='text-xl font-medium text-gray-900 dark:text-white'>Total Amount</div>
                    <div className='text-xl font-medium text-primary-700 dark:text-white'>${totalAmount}</div>
                </div>
                <div className='flex justify-center items-center gap-2'>
                    <ToggleButton
                        checked={checked}
                        onChange={(e) => setChecked(e.value)}
                        className='text-xl font-medium text-black '
                        onLabel='Cash'
                        offLabel='Cash'
                        style={{ width: '100%' }}
                    />
                    <ToggleButton
                        checked={!checked}
                        onChange={onTransfer}
                        className='text-xl font-medium text-black '
                        onLabel='Transfer'
                        offLabel='Transfer'
                        style={{ width: '100%' }}
                    />
                </div>
                <div className='flex flex-col gap-1 '>
                    <label className='text-xl ms-0 font-medium text-gray-900 dark:text-white'>
                        Amount Customer Paid
                    </label>
                    <InputNumber
                        placeholder='Enter Amount'
                        className='w-full'
                        value={amountPaidState}
                        min={0}
                        max={totalAmount}
                        showButtons
                        onValueChange={onSetAmountPaid}
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <DataTable value={[]} className='w-full'>
                        <Column field='#' header='#'></Column>
                        <Column field='Code' header='Code'></Column>
                        <Column field='Payment Method' header='Payment Method'></Column>
                        <Column field='Amount' header='Amount'></Column>
                        <Column field='Date Paid' header='Date Paid'></Column>
                    </DataTable>
                </div>
                <div className='flex justify-between items-center gap-2'>
                    <label className='text-xl ms-0 font-medium text-gray-900 dark:text-white'>Amount Remaining</label>
                    <div className='text-xl font-medium text-primary-700 dark:text-white'>
                        ${amountPaid > totalAmount ? 0 : totalAmount - amountPaid}
                    </div>
                </div>

                <div className='flex justify-end items-center gap-2'>
                    <Button label='Save' icon='pi pi-save' onClick={onSave} />
                </div>
            </div>
        </Dialog>
    )
}