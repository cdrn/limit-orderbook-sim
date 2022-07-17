import { assert } from "node:console";
import { FastLimitOrderbook } from "./orderbook";

// Mock away Date.now such that our timestamps don't break snapshots
jest
  .spyOn(global.Date, "now")
  .mockImplementation(() => new Date("2019-05-14T11:01:58.135Z").valueOf());

const generateRandomOrders = (numOrders: number) => {
  const orders = [];
  for (let i = 0; i < numOrders; i++) {
    orders.push({
      buyOrSell: Math.random() > 0.5 ? true : false,
      limit: BigInt(Math.floor(Math.random() * 100)),
      shares: BigInt(Math.floor(Math.random() * 100)),
    });
  }
  return orders;
};

test("a Fastlimit orderbook object can be instantiated", () => {
  assert(FastLimitOrderbook());
});

test("An order can be added to the orderbook correctly", () => {
  const orderbook = FastLimitOrderbook();
  const order = {
    buyOrSell: true,
    shares: BigInt(1),
    limit: BigInt(1),
    entryTime: BigInt(1),
    eventTime: BigInt(1),
    nextOrder: null,
    prevOrder: null,
    parentLimit: null,
  };
  orderbook.addOrder(order);
  const limitOrder = orderbook.getOrdersAtLimitPrice(BigInt(1), true);
  expect(limitOrder).toMatchSnapshot();
});

test("Add multiple orders at different limits to the orderbook", () => {
  const orderbook = FastLimitOrderbook();
  const orders = generateRandomOrders(500);

  console.log(orders.length, "orders generated!");

  for (const order of orders) {
    orderbook.addOrder(order);
  }
  const limitBuyOrders = orderbook.getOrdersAtLimitPrice(BigInt(1), true);
  console.log("LIMITS");
  console.log(orderbook.getAllLimits());
  console.log("ORDERS LENGTH");
  console.log(orderbook.getAllOrders());
});
