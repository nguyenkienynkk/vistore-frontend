'use client'
import { ManufacturerName } from '@/interface/manufacturer.interface'
import { ProductAttribute, ProductRequest } from '@/interface/Product'
import { ProductAttributeName } from '@/interface/productAttribute.interface'
import ProductService from '@/service/ProducrService'
import Image from 'next/image'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { PrimeIcons } from 'primereact/api'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Column, ColumnEvent } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import { Editor } from 'primereact/editor'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { TreeNode } from 'primereact/treenode'
import { TreeSelect } from 'primereact/treeselect'
import { useRef, useState } from 'react'
import { Toast } from 'primereact/toast'
import { useRouter } from 'next/navigation'
import ManagerPath from '@/constants/ManagerPath'
import Spinner from '@/components/spinner/Spinner'

export interface AttributeRow {
    selectedAttribute: ProductAttributeName | null
    selectedValues: string[]
}

interface CombinedRow {
    name: string
    sku: string
    gtin: string
    unitPrice: number
    productCost: number
    quantity: number
    images: File[]
}

interface ColumnMeta {
    field: string
    header: string
}

const columns: ColumnMeta[] = [
    { field: 'name', header: 'Name' },
    { field: 'unitPrice', header: 'Unit Price' },
    { field: 'productCost', header: 'Product Cost' },
    { field: 'quantity', header: 'Quantity' }
]
interface ProductAddFormProps {
    categories: TreeNode[]
    manufacturers: ManufacturerName[]
    productAttributes: ProductAttributeName[]
}
const ProductAddForm: React.FC<ProductAddFormProps> = ({ categories, manufacturers, productAttributes }) => {
    const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([])
    const [combinedRows, setCombinedRows] = useState<CombinedRow[]>([])
    const [name, setName] = useState<string>('')
    const [weight, setWeight] = useState<number>(0)
    const [selectedCategory, setSelectedCategory] = useState<{ id: number } | null>(null)
    const [selectedManufacture, setSelectedManufacture] = useState<{ id: number } | null>(null)
    const [text, setText] = useState<string>('')
    const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File[] }>({})
    const [uploadedImages, setUploadedImages] = useState<{ [key: number]: string[] }>({})
    const [nameError, setNameError] = useState<string>('')
    const [categoryError, setCategoryError] = useState<string>('')
    const [manufactureError, setManufactureError] = useState<string>('')
    const [weightError, setWeightError] = useState<string>('')
    const [bulkValues, setBulkValues] = useState({
        unitPrice: 0,
        productCost: 0,
        quantity: 0
    })
    const toast = useRef<Toast>(null)

    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const addCustomTag = (tag: string, index: number) => {
        setAttributeRows((prevRows) => {
            const newRows = [...prevRows]
            const row = newRows[index]
            if (tag && !row.selectedValues.includes(tag)) {
                row.selectedValues.push(tag)
            }
            return newRows
        })
    }

    const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (event.key === 'Enter') {
            const input = (event.target as HTMLInputElement).value.trim()

            // Validate input
            if (input === '') return
            if (input.length > 50) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Attribute value cannot exceed 50 characters',
                    life: 3000
                })
                return
            }
            if (!/^[a-zA-Z0-9\s]+(?:-[a-zA-Z0-9\s]+)*$/.test(input)) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Only letters, numbers, spaces and hyphens are allowed, but hyphens cannot be followed by numbers',
                    life: 3000
                })
                return
            }

            addCustomTag(input, index)
            ;(event.target as HTMLInputElement).value = ''
            setTimeout(() => {
                generateCombinations()
            }, 100)
        }
    }

    const handleChange = (value: string[], index: number) => {
        const updatedRows = [...attributeRows]
        updatedRows[index].selectedValues = value
        setAttributeRows(updatedRows)

        generateCombinations()
        if (updatedRows[index].selectedValues.length === 0) {
            setCombinedRows([])
            generateCombinations()
        }
    }

    const addAttributeRow = () => {
        setAttributeRows([...attributeRows, { selectedAttribute: null, selectedValues: [] }])
    }
    const generateCombinations = () => {
        const selectedAttributes = attributeRows.filter((row) => row.selectedAttribute && row.selectedValues.length > 0)

        if (selectedAttributes.length > 0) {
            const values = selectedAttributes.map((row) => row.selectedValues)
            const newCombinations: CombinedRow[] = []

            const generateCombos = (current: string[], depth: number) => {
                if (depth === values.length) {
                    const name = current.join(' - ')
                    const existingRowIndex = combinedRows.findIndex((row) => row.name === name)

                    if (existingRowIndex === -1) {
                        newCombinations.push({
                            name: name,
                            sku: '',
                            productCost: 100,
                            unitPrice: 100,
                            quantity: 10,
                            gtin: '',
                            images: []
                        })
                    } else {
                        const existingRow = combinedRows[existingRowIndex]
                        newCombinations.push({
                            name: name,
                            sku: existingRow.sku || '',
                            productCost: existingRow.productCost || 0,
                            unitPrice: existingRow.unitPrice || 0,
                            quantity: existingRow.quantity || 0,
                            gtin: existingRow.gtin || '',
                            images: []
                        })
                    }
                    return
                }

                for (const value of values[depth]) {
                    generateCombos([...current, value], depth + 1)
                }
            }

            generateCombos([], 0)

            setCombinedRows(newCombinations)
        } else {
            setCombinedRows([])
        }
    }

    const removeCombinationRow = (index: number) => {
        const newCombinedRows = combinedRows.filter((_, i) => i !== index)

        const updatedAttributeRows = attributeRows.map((row) => {
            const updatedSelectedValues = row.selectedValues.filter((value) =>
                newCombinedRows.some((combinedRow) => combinedRow.name.includes(value))
            )
            return { ...row, selectedValues: updatedSelectedValues }
        })

        generateCombinations()
        setCombinedRows(newCombinedRows)
        setAttributeRows(updatedAttributeRows)
    }

    const removeAttributeRow = (index: number) => {
        setAttributeRows((prevRows) => prevRows.filter((_, i) => i !== index))
        attributeRows[index].selectedValues = []
        generateCombinations()
    }

    const isPositiveInteger = (val: number) => {
        let str = String(val)

        str = str.trim()

        if (!str) {
            return false
        }

        str = str.replace(/^0+/, '') || '0'
        const n = Math.floor(Number(str))

        return n !== Infinity && String(n) === str && n >= 0
    }

    const onCellEditComplete = (e: ColumnEvent) => {
        const { rowData, newValue, field, originalEvent: event } = e

        switch (field) {
            case 'quantity':
                if (newValue && Number(newValue) > 1000000) {
                    event.preventDefault()
                } else if (isPositiveInteger(newValue)) {
                    rowData[field] = newValue
                } else {
                    event.preventDefault()
                }
                break
            case 'unitPrice':
                if (newValue && Number(newValue) > 1000000) {
                    event.preventDefault()
                } else if (isPositiveInteger(newValue)) {
                    if (Number(newValue) < Number(rowData.productCost)) {
                        event.preventDefault()
                    } else {
                        rowData[field] = newValue
                    }
                } else {
                    event.preventDefault()
                }
                break
            case 'productCost':
                if (newValue && Number(newValue) > 1000000) {
                    event.preventDefault()
                } else if (isPositiveInteger(newValue)) {
                    rowData[field] = newValue
                } else {
                    event.preventDefault()
                }
                break

            case 'sku':
                if (isSkuUnique(newValue)) {
                    rowData[field] = newValue
                } else {
                    event.preventDefault()
                }
                break

            default:
                if (newValue.trim().length > 0) {
                    rowData[field] = newValue
                } else {
                    event.preventDefault()
                }
                break
        }
    }

    const validateFields = () => {
        const errors: { name?: string; category?: string; manufacture?: string; attribute?: string; weight?: string } =
            {}

        if (!name || name.trim() === '') {
            errors.name = 'Product name is required'
        }

        if (!selectedCategory) {
            errors.category = 'Category is required'
        }

        if (!selectedManufacture) {
            errors.manufacture = 'Manufacturer is required'
        }
        if (weight <= 0) {
            errors.weight = 'Weight must be greater than 0'
        }
        const missingAttributes = attributeRows.filter((row) => {
            return row.selectedAttribute && row.selectedValues.length === 0
        })
        if (missingAttributes.length > 0) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Please select all attributes for each combination',
                life: 3000
            })
            errors.attribute = 'Please select all attributes for each combination'
        }
        return errors
    }
    const isSkuUnique = (sku: string) => {
        return !combinedRows.some((row) => row.sku === sku)
    }
    const getAvailableAttributes = () => {
        const selectedAttributeCodes = new Set(attributeRows.map((row) => row.selectedAttribute?.id).filter(Boolean))
        return productAttributes.filter((attr) => !selectedAttributeCodes.has(attr.id))
    }
    const handleAddProduct = async () => {
        if (combinedRows.length === 0) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Please add at least one combination',
                life: 3000
            })
            return
        }
        try {
            setIsLoading(true)
            const errors = validateFields()
            setNameError(errors.name || '')
            setCategoryError(errors.category || '')
            setManufactureError(errors.manufacture || '')
            setWeightError(errors.weight || '')
            if (Object.keys(errors).length > 0) {
                return
            }

            const commonProductInfo: Omit<
                ProductRequest,
                'id' | 'name' | 'sku' | 'gtin' | 'quantity' | 'unitPrice' | 'productCost' | 'attributes'
            > = {
                fullDescription: text,
                weight: 12,
                published: true,
                deleted: false,
                categoryId: selectedCategory?.id !== undefined ? selectedCategory.id : undefined,
                manufacturerId: selectedManufacture?.id !== undefined ? selectedManufacture.id : undefined
            }

            const productsData: ProductRequest[] = combinedRows.map((combinedRow) => {
                const attributes: ProductAttribute[] = attributeRows
                    .map((row) => {
                        const [attributeValue] = combinedRow.name
                            .split(' - ')
                            .filter((value) => row.selectedValues.includes(value))
                        if (attributeValue) {
                            return {
                                id: row.selectedAttribute?.id || null,
                                productId: undefined,
                                value: attributeValue
                            } as ProductAttribute
                        }
                        return undefined
                    })
                    .filter(Boolean) as ProductAttribute[]

                return {
                    ...commonProductInfo,
                    id: undefined,
                    name: name,
                    sku: combinedRow.sku,
                    gtin: combinedRow.gtin,
                    quantity: combinedRow.quantity,
                    unitPrice: combinedRow.unitPrice,
                    productCost: combinedRow.productCost,
                    attributes: attributes,
                    weight: weight
                }
            })

            try {
                const uploadedFilesObj: { [key: number]: File[] } = uploadedFiles
                const uploadedFilesArray: File[][] = Object.values(uploadedFilesObj)

                await ProductService.addProducts(productsData, uploadedFilesArray)
                setIsLoading(false)
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Products added successfully!',
                    life: 3000
                })
                router.push(ManagerPath.PRODUCT)
            } catch (error) {
                console.error('Error:', error)
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add products.',
                    life: 3000
                })
            }
        } catch (error) {
            console.error('Error deleting bill:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const onUpload = (event: React.ChangeEvent<HTMLInputElement>, rowIndex: number) => {
        const files = event.target.files

        if (files && files.length > 0) {
            const file = files[0]
            const imageUrl = URL.createObjectURL(file)

            setUploadedImages((prev) => ({
                ...prev,
                [rowIndex]: [imageUrl]
            }))

            setUploadedFiles((prev) => ({
                ...prev,
                [rowIndex]: [file]
            }))
        }
    }

    const onRemoveImage = (rowIndex: number, imageIndex: number) => {
        setUploadedImages((prevImages) => {
            const updatedImages = { ...prevImages }
            updatedImages[rowIndex] = updatedImages[rowIndex].filter((_, index) => index !== imageIndex)
            return updatedImages
        })
    }

    const handleBulkUpdate = (field: 'unitPrice' | 'productCost' | 'quantity', value: number) => {
        setBulkValues((prev) => ({ ...prev, [field]: value }))
    }

    const applyBulkUpdate = (field: 'unitPrice' | 'productCost' | 'quantity') => {
        const value = bulkValues[field]
        if (value >= 0) {
            setCombinedRows((prevRows) =>
                prevRows.map((row) => ({
                    ...row,
                    [field]: value
                }))
            )
        }
    }

    return (
        <div>
            <Toast ref={toast} />
            <Spinner isLoading={isLoading} />
            <div className='card'>
                <h4>Add Product</h4>
                <div className='flex flex-column gap-4'>
                    <div className='flex flex-row gap-4'>
                        <div className='flex flex-column gap-2 w-full'>
                            <label htmlFor='productName'>
                                Product Name{' '}
                                <i className='pi pi-exclamation-circle p-error' style={{ fontSize: '1rem' }}></i>
                            </label>
                            <InputText
                                id='productName'
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value.trim() === '') {
                                        setNameError('Product name is required')
                                    } else if (value.length <= 50) {
                                        setName(value)
                                        setNameError('')
                                    } else {
                                        setNameError('Product name cannot exceed 50 characters')
                                    }
                                }}
                                placeholder='Enter product name'
                                className={`${nameError ? 'p-invalid' : ''}`}
                            />
                            {nameError && <small className='p-error'>{nameError}</small>}
                        </div>
                        <div className='flex flex-column gap-2 w-full'>
                            <label htmlFor='weight'>
                                Weight <i className='pi pi-exclamation-circle p-error' style={{ fontSize: '1rem' }}></i>
                            </label>
                            <InputNumber
                                inputId='minmax-buttons'
                                onValueChange={(e) => {
                                    if (e.value && e.value <= 0) {
                                        setWeightError('Weight must be greater than 0')
                                    } else {
                                        setWeight(e.value || 0)
                                        setWeightError('')
                                    }
                                }}
                                placeholder='Enter weight'
                                mode='decimal'
                                showButtons
                                min={0}
                                value={weight}
                                suffix='g'
                                className={`${weightError ? 'p-invalid' : ''}`}
                            />
                            {weightError && <small className='p-error'>{weightError}</small>}
                        </div>
                    </div>

                    <div className='flex flex-row gap-4 align-items-center'>
                        <div className='flex flex-column gap-2 w-full'>
                            <label htmlFor='category'>
                                Categories{' '}
                                <i className='pi pi-exclamation-circle p-error' style={{ fontSize: '1rem' }}></i>
                            </label>
                            <TreeSelect
                                id='category'
                                value={selectedCategory ? String(selectedCategory.id) : null}
                                onChange={(e) => {
                                    setSelectedCategory({ id: Number(e.value) })
                                    setCategoryError('')
                                }}
                                options={categories}
                                filter
                                placeholder='Select a category'
                                showClear
                                className={`${categoryError ? 'p-invalid' : ''}`}
                            />
                            {categoryError && <small className='p-error'>{categoryError}</small>}
                        </div>
                        <div className='flex flex-column gap-2 w-full'>
                            <label htmlFor='brand'>
                                Manufactures{' '}
                                <i className='pi pi-exclamation-circle p-error' style={{ fontSize: '1rem' }}></i>
                            </label>
                            <Dropdown
                                value={selectedManufacture}
                                onChange={(e) => {
                                    setSelectedManufacture(e.value)
                                    setManufactureError('')
                                }}
                                options={manufacturers}
                                placeholder='Select a manufacture'
                                optionLabel='manufacturerName'
                                className={`${manufactureError ? 'p-invalid' : ''}`}
                            />
                            {manufactureError && <small className='p-error'>{manufactureError}</small>}
                        </div>
                    </div>

                    <div className='flex flex-row gap-4 align-items-center'>
                        <div className='flex flex-column gap-2 w-full'>
                            {
                                <Editor
                                    value={text}
                                    onTextChange={(e) => setText(e.htmlValue || '')}
                                    style={{ height: '100px', width: '100%' }}
                                    placeholder='Enter product description'
                                />
                            }
                        </div>
                    </div>
                </div>

                <Accordion className='mt-5' activeIndex={0}>
                    <AccordionTab header='Attributes'>
                        {attributeRows.map((row, index) => (
                            <div key={index} className='mb-4 flex items-center'>
                                <Dropdown
                                    value={row.selectedAttribute}
                                    options={[
                                        ...getAvailableAttributes(),
                                        ...productAttributes.filter((attr) => attr.id === row.selectedAttribute?.id)
                                    ]}
                                    onChange={(e) => {
                                        const updatedRows = [...attributeRows]
                                        updatedRows[index].selectedAttribute = e.value
                                        setAttributeRows(updatedRows)
                                        generateCombinations()
                                    }}
                                    optionLabel='name'
                                    placeholder='Select an attribute'
                                    className='w-[200px] mr-4'
                                    style={{ minWidth: '200px', width: '200px', maxWidth: '200px' }}
                                />
                                <AutoComplete
                                    value={row.selectedValues}
                                    suggestions={row.selectedValues}
                                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) =>
                                        handleKeydown(event, index)
                                    }
                                    placeholder='Enter values'
                                    multiple
                                    onChange={(e) => handleChange(e.value, index)}
                                    className='w-full'
                                />
                                <Button
                                    className='pi pi-trash bg-gray-500 text-xs'
                                    onClick={() => removeAttributeRow(index)}
                                />
                            </div>
                        ))}
                        <Button onClick={addAttributeRow} className='flex items-center mb-5'>
                            <i className={PrimeIcons.PLUS}></i>
                            <span className='ml-2'>Add attribute</span>
                        </Button>

                        {combinedRows.length > 0 && (
                            <div className='flex flex-row gap-4 mb-4 mt-4'>
                                <div className='flex-1'>
                                    <label htmlFor='bulkUnitPrice' className='block mb-2'>
                                        Bulk Unit Price
                                    </label>
                                    <div className='flex gap-2'>
                                        <InputNumber
                                            id='bulkUnitPrice'
                                            value={bulkValues.unitPrice}
                                            onValueChange={(e) => handleBulkUpdate('unitPrice', e.value || 0)}
                                            min={0}
                                            max={1000000}
                                        />
                                        <Button onClick={() => applyBulkUpdate('unitPrice')} label='Apply' />
                                    </div>
                                </div>
                                <div className='flex-1'>
                                    <label htmlFor='bulkProductCost' className='block mb-2'>
                                        Bulk Product Cost
                                    </label>
                                    <div className='flex gap-2'>
                                        <InputNumber
                                            id='bulkProductCost'
                                            value={bulkValues.productCost}
                                            onValueChange={(e) => handleBulkUpdate('productCost', e.value || 0)}
                                            min={0}
                                            max={1000000}
                                        />
                                        <Button onClick={() => applyBulkUpdate('productCost')} label='Apply' />
                                    </div>
                                </div>
                                <div className='flex-1'>
                                    <label htmlFor='bulkQuantity' className='block mb-2'>
                                        Bulk Quantity
                                    </label>
                                    <div className='flex gap-2'>
                                        <InputNumber
                                            id='bulkQuantity'
                                            value={bulkValues.quantity}
                                            onValueChange={(e) => handleBulkUpdate('quantity', e.value || 0)}
                                            min={0}
                                            max={1000000}
                                        />
                                        <Button onClick={() => applyBulkUpdate('quantity')} label='Apply' />
                                    </div>
                                </div>
                            </div>
                        )}
                        {combinedRows.length > 0 && (
                            <DataTable
                                value={combinedRows}
                                editMode='cell'
                                resizableColumns
                                showGridlines
                                tableStyle={{ minWidth: '50rem' }}
                            >
                                {columns.map(({ field, header }) => {
                                    if (field === 'name') {
                                        return (
                                            <Column
                                                key={field}
                                                field={field}
                                                header={header}
                                                style={{ width: '25%' }}
                                            />
                                        )
                                    }
                                    return (
                                        <Column
                                            key={field}
                                            field={field}
                                            header={header}
                                            editor={(options) => (
                                                <InputText
                                                    type='text'
                                                    style={{
                                                        width: '100%'
                                                    }}
                                                    value={options.value}
                                                    onChange={(e) => options.editorCallback?.(e.target.value)}
                                                />
                                            )}
                                            onCellEditComplete={onCellEditComplete}
                                            style={{ width: '25%' }}
                                        />
                                    )
                                })}
                                <Column
                                    header='Image'
                                    body={(rowData, column) => (
                                        <div style={{ width: '100px' }}>
                                            {!uploadedImages[column.rowIndex] ||
                                            uploadedImages[column.rowIndex].length === 0 ? (
                                                <label className='cursor-pointer rounded-lg justify-center items-center mb-4'>
                                                    <input
                                                        type='file'
                                                        onChange={(event) => onUpload(event, column.rowIndex)}
                                                        className='hidden cursor-pointer'
                                                    />
                                                    <span className='text-gray-600 '>
                                                        <i className='pi pi-image text-2xl mb-2 '></i>
                                                    </span>
                                                </label>
                                            ) : null}

                                            <div className='flex justify-center items-center'>
                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full'>
                                                    {uploadedImages[column.rowIndex] &&
                                                        uploadedImages[column.rowIndex].map((imageSrc, imageIndex) => (
                                                            <div
                                                                key={imageIndex}
                                                                className='relative flex justify-center items-center'
                                                            >
                                                                <Image
                                                                    src={imageSrc}
                                                                    alt={`Uploaded image ${imageIndex}`}
                                                                    width={100}
                                                                    height={100}
                                                                    className='rounded-md object-cover shadow-md'
                                                                />
                                                                <button
                                                                    className='absolute cursor-pointer border-none rounded-full px-1 top-[-5px] right-[-5px] bg-red-400 text-white transition-all duration-300 ease-in-out hover:bg-red-600 hover:scale-110'
                                                                    onClick={() =>
                                                                        onRemoveImage(column.rowIndex, imageIndex)
                                                                    }
                                                                >
                                                                    <i className='pi pi-times'></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    style={{ width: '350px', textAlign: 'center' }}
                                />

                                <Column
                                    header='Delete'
                                    body={(rowData, column) => (
                                        <Button
                                            icon='pi pi-trash'
                                            className='p-button-danger'
                                            onClick={() => removeCombinationRow(column.rowIndex)}
                                        />
                                    )}
                                    style={{ width: '100px', textAlign: 'center' }}
                                />
                            </DataTable>
                        )}
                    </AccordionTab>
                </Accordion>
                <Button disabled={combinedRows.length === 0} onClick={handleAddProduct}>
                    Add New
                </Button>
            </div>
        </div>
    )
}

export default ProductAddForm
