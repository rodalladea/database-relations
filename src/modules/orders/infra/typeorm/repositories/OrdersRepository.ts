import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormOrderRepository: Repository<Order>;

  private ormOrdersProductsRepository: Repository<OrdersProducts>;

  constructor() {
    this.ormOrderRepository = getRepository(Order);
    this.ormOrdersProductsRepository = getRepository(OrdersProducts);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    let order = this.ormOrderRepository.create({
      customer,
      order_products: products,
    });

    order = await this.ormOrderRepository.save(order);

    const ordersProducts = products.map(product => {
      return this.ormOrdersProductsRepository.create({
        order,
        product_id: product.product_id,
        quantity: product.quantity,
        price: product.price,
      });
    });

    await this.ormOrdersProductsRepository.save(ordersProducts);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormOrderRepository.findOne(id);

    return order;
  }
}

export default OrdersRepository;
