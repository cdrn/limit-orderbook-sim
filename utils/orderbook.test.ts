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
      buy: Math.random() > 0.5 ? true : false,
      limit: BigInt(Math.floor(Math.random() * 50)),
      shares: BigInt(Math.floor(Math.random() * 50)),
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
    buy: true,
    shares: BigInt(1),
    limit: BigInt(1),
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
  console.log("limit buy orders at 1", limitBuyOrders);
  console.log("num orders", Object.keys(orderbook.getAllOrders())?.length);
  console.log("num buy limits", Object.keys(orderbook.getAllBuyLimits()));
  console.log(
    "num sell limits",
    Object.keys(orderbook.getAllSellLimits())?.length
  );

  console.log("test execute order function...", orderbook.executeOrders());
});
