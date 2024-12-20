import { Promotion } from '@/interface/discount.interface'
import http from '@/libs/http'

class DiscountService {
    private basePath = '/api/admin/discounts'

    async getAll() {
        const response = await http.get<Promotion[]>(`${this.basePath}?discountTypeId=ASSIGNED_TO_PRODUCTS`)
        return response
    }

    async createDiscount(discountData: Promotion) {
        const response = await fetch('http://localhost:8080/api/admin/discounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(discountData)
        })

        if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(`Failed to create discount: ${errorResponse.message || 'Unknown error'}`)
        }

        return response.json()
    }

    async getById(id: number) {
        return await http.get<Promotion>(`${this.basePath}/${id}`)
    }

    async markAsExpired(id: number | undefined) {
        const response = await fetch(`http://localhost:8080/api/admin/discounts/${id}/end-date-now`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(`Failed to mark discount as expired: ${errorResponse.message || 'Unknown error'}`)
        }

        return response.json()
    }

    async cancelDiscount(id: number | undefined) {
        const response = await fetch(`http://localhost:8080/api/admin/discounts/${id}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const errorResponse = await response.json()
            throw new Error(`Failed to cancel discount: ${errorResponse.message || 'Unknown error'}`)
        }

        return response.json()
    }

    async update(id: number, address: Omit<Promotion, 'id'>): Promise<Promotion> {
        const response = await http.put<Promotion>(`${this.basePath}/${id}`, address)
        return response.payload
    }
}

const discountService = new DiscountService()
export default discountService
