import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Does not exists this customer.');
    }

    const productsData = await this.productsRepository.findAllById(
      products.map(product => ({
        id: product.id,
      })),
    );

    if (productsData.length !== products.length) {
      throw new AppError('Cannot find the products.');
    }

    const updatedQuantity: IUpdateProductsQuantityDTO[] = [];
    const productsOrdered = productsData.map((productData, index) => {
      if (productData.quantity < products[index].quantity) {
        throw new AppError('There is not enough products.');
      }

      updatedQuantity.push({
        id: products[index].id,
        quantity: productData.quantity - products[index].quantity,
      });

      return {
        product_id: productData.id,
        price: productData.price,
        quantity: products[index].quantity,
      };
    });

    await this.productsRepository.updateQuantity(updatedQuantity);

    const order = await this.ordersRepository.create({
      customer,
      products: productsOrdered,
    });

    return order;
  }
}

export default CreateOrderService;
