import { assert } from "node:console";
import { FastLimitOrderbook } from "./orderbook";

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
  const limitOrder = orderbook.getOrdersAtLimitPrice(BigInt(1));
  console.log(limitOrder);
});
