'use client'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { FileUpload, FileUploadUploadEvent } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { Toolbar } from 'primereact/toolbar'
import { useRef, useState } from 'react'
import { Category } from '@/interface/category.interface'
import { Dialog } from 'primereact/dialog'
import { classNames } from 'primereact/utils'
import { TreeSelect } from 'primereact/treeselect'
import { TreeNode } from 'primereact/treenode'
import categoryService from '@/service/category.service'
import Image from 'next/image'
import { Image as PrimeImage } from 'primereact/image'
import RequiredIcon from '@/components/icon/RequiredIcon'

interface CategoryProps {
    initialData: Category[]
    initialNodes: TreeNode[]
}

const emptyCategory: Category = {
    name: '',
    description: '',
    linkImg: '',
    categoryParentId: null
}

const ListView = ({ initialData, initialNodes }: CategoryProps) => {
    const [categories, setCategories] = useState<Category[]>(initialData)
    const [nodes, setNodes] = useState<TreeNode[]>(initialNodes)
    const [category, setCategory] = useState<Category>(emptyCategory)
    const [selectedCategories, setSelectedCategories] = useState<Category>()
    const [submitted, setSubmitted] = useState(false)
    const [categoryDialog, setCategoryDialog] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const toast = useRef<Toast>(null)
    const dt = useRef<DataTable<Category[]>>(null)

    const exportCSV = () => {
        dt.current?.exportCSV()
    }

    const openNew = () => {
        setCategory(emptyCategory)
        setSubmitted(false)
        setCategoryDialog(true)
    }

    const hideDialog = () => {
        setSubmitted(false)
        setCategoryDialog(false)
    }

    const editCategory = (category: Category) => {
        setCategory({ ...category })
        setCategoryDialog(true)
    }

    const onUpload = async (e: FileUploadUploadEvent) => {
        const response = JSON.parse(e.xhr.response)
        const imageUrl = response.data
        setCategory({ ...category, linkImg: imageUrl })
        if (category.id) {
            await categoryService.update(category.id, category)
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Category Updated',
                life: 3000
            })
        }
    }

    const fetchCategories = async () => {
        const { payload: data } = await categoryService.getAll()
        const { payload: newNodes } = await categoryService.getListName()
        const treeNodes = categoryService.convertToTreeNode(newNodes)

        setCategories(data.items)
        setNodes(treeNodes)
    }

    const saveCategory = async () => {
        setSubmitted(true)
        if (category.name.trim()) {
            if (!category.id) {
                await categoryService.create(category)
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Category Created',
                    life: 3000
                })
            } else {
                const originalCategory = categories.find((cat) => cat.id === category.id)
                if (
                    category.id == originalCategory?.id &&
                    category.name == originalCategory.name &&
                    category.categoryParentId == originalCategory.categoryParentId &&
                    category.linkImg == originalCategory.linkImg
                ) {
                    setCategoryDialog(false)
                    return
                }
                await categoryService.update(category.id, category)
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Category Updated',
                    life: 3000
                })
            }
            setCategoryDialog(false)
            setCategory(emptyCategory)
            await fetchCategories()
        }
    }

    const leftToolbarTemplate = () => {
        return (
            <div className='flex flex-wrap gap-2'>
                <Button label='New' icon='pi pi-plus' severity='success' onClick={openNew} />
                <Button
                    label='Delete'
                    icon='pi pi-trash'
                    severity='danger'
                    // onClick={confirmDeleteSelected}
                    disabled={!selectedCategories || !Array.isArray(selectedCategories) || !selectedCategories.length}
                />
            </div>
        )
    }

    const rightToolbarTemplate = () => {
        return (
            <>
                <FileUpload
                    mode='basic'
                    accept='image/*'
                    maxFileSize={1000000}
                    chooseLabel='Import'
                    className='mr-2 inline-block'
                />
                <Button label='Export' icon='pi pi-upload' severity='help' onClick={exportCSV} />
            </>
        )
    }

    const imageBodyTemplate = (rowData: Category) => {
        return (
            <Image
                src={rowData.linkImg}
                alt={rowData.linkImg}
                className='shadow-2 border-round'
                width={64}
                height={45}
                style={{ minHeight: '45px' }}
            />
        )
    }

    const actionBodyTemplate = (rowData: Category) => {
        return (
            <>
                <Button icon='pi pi-pencil' rounded outlined className='mr-2' onClick={() => editCategory(rowData)} />
                <Button
                    icon='pi pi-trash'
                    rounded
                    outlined
                    severity='danger'
                    // onClick={() => confirmDeleteProduct(rowData)}
                />
            </>
        )
    }

    const header = (
        <div className='flex flex-column md:flex-row md:justify-content-between md:align-items-center'>
            <h5 className='m-0'>Manage Categories</h5>
            <span className='block mt-2 md:mt-0 p-input-icon-left'>
                <i className='pi pi-search' />
                <InputText
                    type='search'
                    onInput={(e) => setGlobalFilter(e.currentTarget.value)}
                    placeholder='Search...'
                />
            </span>
        </div>
    )

    const categoryDialogFooter = (
        <>
            <Button label='Cancel' icon='pi pi-times' outlined onClick={hideDialog} />
            <Button label='Save' icon='pi pi-check' onClick={saveCategory} />
        </>
    )

    return (
        <>
            <Toast ref={toast} />
            <div className='card'>
                <Toolbar className='mb-4' start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                <DataTable
                    ref={dt}
                    value={categories}
                    selection={selectedCategories}
                    onSelectionChange={(e) => setSelectedCategories(e.value)}
                    dataKey='id'
                    removableSort
                    resizableColumns
                    showGridlines
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    paginatorTemplate='FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
                    currentPageReportTemplate='Showing {first} to {last} of {totalRecords} categories'
                    globalFilter={globalFilter}
                    emptyMessage='No categories found.'
                    header={header}
                >
                    <Column
                        selectionMode='multiple'
                        headerStyle={{
                            width: '4rem'
                        }}
                    />
                    <Column
                        className='flex justify-center h-full'
                        field='image'
                        align={'center'}
                        header='Image'
                        body={imageBodyTemplate}
                        headerStyle={{
                            width: '8rem'
                        }}
                    />
                    <Column
                        field='name'
                        header='Name'
                        sortable
                        headerStyle={{
                            minWidth: '15rem'
                        }}
                    />
                    <Column field='description' header='Description' sortable />
                    <Column
                        body={actionBodyTemplate}
                        style={{
                            width: '30px'
                        }}
                    />
                </DataTable>
            </div>
            <Dialog
                visible={categoryDialog}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header='Category Details'
                style={{ width: '36vw' }}
                modal
                className='p-fluid'
                footer={categoryDialogFooter}
                onHide={hideDialog}
            >
                <div className='flex gap-x-7'>
                    <PrimeImage src={category.linkImg} alt='Image' imageClassName='shadow-2 rounded-3xl' preview />
                    <div className=''>
                        <div className='field'>
                            <label htmlFor='name' className='font-bold'>
                                Name <RequiredIcon />
                            </label>
                            <InputText
                                id='name'
                                value={category.name}
                                onChange={(e) => setCategory({ ...category, name: e.target.value })}
                                required
                                autoFocus
                                className={classNames({ 'p-invalid': submitted && !category.name })}
                            />
                            {submitted && !category.name && <small className='p-error'>Name is required.</small>}
                        </div>
                        <div className='field'>
                            <label htmlFor='description' className='font-bold'>
                                Description
                            </label>
                            <InputText
                                id='description'
                                value={category.description}
                                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                            />
                        </div>
                        <div className='field'>
                            <label htmlFor='categoryParent' className='font-bold'>
                                Category parent
                            </label>
                            <TreeSelect
                                inputId='categoryParent'
                                value={category.categoryParentId?.toString() || null}
                                onChange={(e) =>
                                    setCategory({ ...category, categoryParentId: Number(e.value as string) })
                                }
                                options={nodes}
                                filter
                                placeholder='Select Item'
                                showClear
                            ></TreeSelect>
                        </div>
                    </div>
                </div>
                <FileUpload
                    mode='basic'
                    name='image'
                    className='mt-4 ml-4'
                    url='http://localhost:8080/api/admin/picture/upload-image'
                    accept='image/*'
                    maxFileSize={1000000}
                    onUpload={onUpload}
                />
            </Dialog>
        </>
    )
}

export default ListView
