import { AddressesResponse } from '@/interface/address.interface'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { useRef, useState } from 'react'

type Props = {
    visible: boolean
    setVisible: (visible: boolean) => void
    addresses: AddressesResponse[]
    setSelectedAddress: (address: AddressesResponse | null) => void
    selectedAddress: AddressesResponse | null
    onSelectAddress: (address: AddressesResponse) => void
}

export default function CustomerAddressDialog({
    visible,
    setVisible,
    addresses,
    setSelectedAddress,
    selectedAddress,
    onSelectAddress
}: Props) {
    const [globalFilter, setGlobalFilter] = useState('')
    const dt = useRef<DataTable<AddressesResponse[]>>(null)

    const header = (
        <div className='flex justify-end '>
            <span className='block mt-2 md:mt-0 p-input-icon-left'>
                <i className='pi pi-search' />
                <InputText
                    type='search'
                    onInput={(e) => setGlobalFilter(e.currentTarget.value)}
                    placeholder='Tìm kiếm...'
                />
            </span>
        </div>
    )

    const actionBodyTemplate = (rowData: AddressesResponse) => {
        return (
            <>
                <Button
                    icon='pi pi-check'
                    className='bg-blue-500 text-white'
                    rounded
                    outlined
                    onClick={() => onSelectAddress(rowData)}
                />
            </>
        )
    }

    return (
        <Dialog
            header='Địa Chỉ Khách Hàng'
            modal
            draggable={false}
            visible={visible}
            style={{ width: '70vw', marginLeft: '15vw' }}
            onHide={() => {
                if (!visible) return
                setVisible(false)
            }}
        >
            <DataTable
                ref={dt}
                value={addresses}
                selection={selectedAddress}
                onSelectionChange={(e) => setSelectedAddress(e.value)}
                dataKey='id'
                removableSort
                resizableColumns
                showGridlines
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                paginatorTemplate='FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
                currentPageReportTemplate='Hiển thị từ {first} đến {last} trong tổng số {totalRecords} địa chỉ'
                globalFilter={globalFilter}
                emptyMessage='Không có địa chỉ nào.'
                header={header}
            >
                <Column
                    field='name'
                    header='Tên'
                    body={(rowData: AddressesResponse) => `${rowData.firstName} ${rowData.lastName}`}
                    sortable
                />
                <Column field='email' header='Email' sortable />
                <Column field='phoneNumber' header='Số Điện Thoại' sortable />
                <Column field='addressDetail' header='Địa Chỉ' sortable />
                <Column field='id' header='Thao Tác' body={actionBodyTemplate}></Column>
            </DataTable>
        </Dialog>
    )
}
