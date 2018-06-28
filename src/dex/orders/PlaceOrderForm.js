import React from 'react';
import { List, InputItem,Button,WingBlank,Slider, Tabs, WhiteSpace, Badge,SegmentedControl, NavBar, Icon,Modal,Switch,Steps,Toast } from 'antd-mobile';
import { Icon as WebIcon,Switch as WebSwitch } from 'antd';
import { connect } from 'dva';
import routeActions from 'common/utils/routeActions'
import {getTokensByMarket} from 'modules/formatter/common'
import {toBig,toHex,getDisplaySymbol} from 'LoopringJS/common/formatter'
import intl from 'react-intl-universal';
import * as orderFormatter from 'modules/orders/formatters'
import moment from 'moment'
import config from 'common/config'
import Notification from 'LoopringUI/components/Notification'
import storage from 'modules/storage'
import Worth from 'modules/settings/Worth'

const Item = List.Item;

// 通过自定义 moneyKeyboardWrapProps 修复虚拟键盘滚动穿透问题
// https://github.com/ant-design/ant-design-mobile/issues/307
// https://github.com/ant-design/ant-design-mobile/issues/163
const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let moneyKeyboardWrapProps;
if (isIPhone) {
  moneyKeyboardWrapProps = {
    onTouchStart: e => e.preventDefault(),
  }
}
const PlaceOrderForm = (props)=>{
  const {dispatch,placeOrder,lastPrice,marketcap,balance,preference,trading} = props
  const {side,pair} = placeOrder
  const tokens = getTokensByMarket(pair)
  const marketConfig = config.getMarketBySymbol(tokens.left, tokens.right)
  const right = config.getTokenBySymbol(tokens.right)
  const amountPrecision = Math.max(0, right.precision - marketConfig.pricePrecision)
  let amount = placeOrder.amountInput
  let price = placeOrder.priceInput
  if(!placeOrder.priceChanged && price === '0' && lastPrice) {
    dispatch({
      type:'placeOrder/priceChangeEffects',
      payload:{
        price:lastPrice
      }
    })
  }
  const total = (Number(amount) > 0) && (Number(price) > 0) ? toBig(amount).times(toBig(price)).toString(10) : 0
  let sell = {}, buy = {}
  if(side === 'buy') {
    sell = {token : tokens.right}
    buy = {token : tokens.left}
  } else {
    sell = {token : tokens.left}
    buy = {token : tokens.right}
  }
   const showLayer = (payload={})=>{
     dispatch({
       type:'layers/showLayer',
       payload:{
         ...payload
       }
     })
   }
   const hideLayer = (payload={})=>{
     dispatch({
       type:'layers/hideLayer',
       payload:{
         ...payload
       }
     })
   }
   const sideChange = (e)=>{
     const side = e.nativeEvent.selectedSegmentIndex === 0 ? 'buy' : 'sell'
     dispatch({
       type:'placeOrder/sideChangeEffects',
       payload:{
         side
       }
     })
  }
  const amountChange = (value)=>{
     dispatch({
       type:'placeOrder/amountChange',
       payload:{
         amountInput:value
       }
     })
  }
  const priceChange = (value)=>{
     dispatch({
       type:'placeOrder/priceChangeEffects',
       payload:{
         price:value
       }
     })
  }
  const showAdvanceChange = (value)=>{
    dispatch({
      type:'placeOrder/showAdvanceChange',
      payload:{
        showAdvance:true
      }
    })
    showLayer({id:'helperOfAdvance'})
  }
  const toConfirm = async () => {
    if (Number(price) <= 0) {
      Toast.info(intl.get('common.invalid_item', {item: intl.get('common.price')}), 3, null, false);
      return
    }
    if (Number(amount) <= 0) {
      Toast.info(intl.get('common.invalid_item', {item: intl.get('common.amount')}), 3, null, false);
      return
    }
    if(price !== placeOrder.priceInput) {
      priceChange(price)
    }
    if(!storage.wallet.getUnlockedAddress()) {
      Notification.open({
        message: intl.get('notifications.title.place_order_failed'),
        type: "error",
        description: intl.get('notifications.message.wallet_locked')
      });
      return
    }
    if(!balance || !marketcap) {
      Notification.open({
        message:intl.get('notifications.title.place_order_failed'),
        description:intl.get('notifications.message.failed_fetch_data_from_server'),
        type:'error'
      })
      return
    }
    const total = toBig(price).times(amount)
    const totalWorth = orderFormatter.calculateWorthInLegalCurrency(marketcap, tokens.right, total)
    if(!totalWorth.gt(0)) {
      Notification.open({
        message:intl.get('notifications.title.place_order_failed'),
        description:intl.get('notifications.message.failed_fetch_data_from_server'),
        type:'error'
      })
      return
    }
    let allowed = false
    let currency = preference.currency;
    let priceSymbol = getDisplaySymbol(currency)
    if(currency === 'USD') {
      priceSymbol = '100' + priceSymbol
      if(totalWorth.gt(100)) {
        allowed = true
      }
    } else {
      priceSymbol = '500' + priceSymbol
      if(totalWorth.gt(500)) {
        allowed = true
      }
    }
    if(!allowed) {
      Notification.open({
        message:intl.get('notifications.title.not_allowed_place_order_worth'),
        description:intl.get('notifications.message.not_allowed_place_order_worth', {worth: priceSymbol}),
        type:'error'
      })
      return
    }
    const validSince = moment()
    const validUntil = moment().add(1, 'months')
    dispatch({type:'placeOrder/validTimeChange', payload:{validSince, validUntil}})
    showLayer({id:'placeOrderSteps'})
  }
  const showAmountHelper = () => {
    if(side === 'buy') {
      if(Number(price) > 0) {
        showLayer({id:'helperOfAmount',side:'sell'})
      } else {
        Toast.info(intl.get('common.invalid_item', {item: intl.get('common.price')}), 3, null, false);
      }
    } else {
      showLayer({id:'helperOfAmount',side:'sell'})
    }
  }
  const menu1 = `${intl.get("common.buy")} ${tokens.left}`
  const menu2 = `${intl.get("common.sell")} ${tokens.left}`
  return (
    <div>
       <div className="pl10 pr10 pt10 pb5 bg-white segmented-fs16">
         <SegmentedControl
           values={[menu1, menu2]}
           style={{height:'40px'}}
           className="m-auto"
           selectedIndex={side === 'buy' ? 0 : 1}
           onChange={sideChange}
         />
       </div>
       <List className="bg-none no-border">
        <InputItem
          type="money"
          placeholder={`0.${'0'.repeat(marketConfig.pricePrecision)}`}
          value={price ? price : null}
          clear
          moneyKeyboardAlign="right"
          moneyKeyboardWrapProps={moneyKeyboardWrapProps}
          extra={
            <div style={{width:'25px',textAlign:'right'}}>
              <WebIcon className="color-black-2" type="profile" style={{padding:'2px 0px 5px'}}onClick={showLayer.bind(this,{id:'helperOfPrice',side:'sell'})} />
            </div>
          }
          onChange={priceChange}
        ><div className="fs16 color-black-3">{intl.get("common.price")}</div></InputItem>
      </List>
      <List className="bg-none no-border">
        <InputItem
          type="money"
          placeholder={amountPrecision > 0 ? `0.${'0'.repeat(amountPrecision)}` : '0'}
          value={amount ? amount : null}
          clear
          onChange={amountChange}
          moneyKeyboardAlign="right"
          moneyKeyboardWrapProps={moneyKeyboardWrapProps}
          extra={
            <div style={{width:'25px',textAlign:'right'}}>
              <WebIcon className="color-black-2" type="profile" style={{padding:'2px 0px 5px'}} onClick={showAmountHelper} />
            </div>
          }
        ><div className="fs16 color-black-3">{intl.get("common.amount")}</div></InputItem>
      </List>
      <List className="bg-none no-border">
        <Item>
          <div className="row align-items-center ml0 mr0 mb10 mt5 fs16 no-gutters">
            <div className="col color-black-3 pl0 fs16">{intl.get("common.total")}</div>
            <div className="col-auto pr0">
              <span className="color-black-1"><Worth amount={total} symbol={tokens.right}/> ≈ </span>
              <span className="color-black-1">{total} {tokens.right}</span>
            </div>
          </div>
          {
            side === 'sell' &&
            <Button onClick={toConfirm} className="w-100 d-block mb5 fs16" type="ghost" disabled={false}>
              {intl.get("common.sell")} {amount} {tokens.left}
            </Button>
          }
          {
            side === 'buy' &&
            <Button onClick={toConfirm} className="w-100 d-block mb5 fs16" type="ghost" disabled={false}>
              {intl.get("common.buy")} {amount} {tokens.left}
            </Button>
          }
        </Item>
      </List>

    </div>
  )
}
export default connect(({
  placeOrder,
  sockets:{tickers, balance, marketcap},
  settings:{preference,trading}
})=>({
  placeOrder,
  lastPrice:tickers.item.loopr ? tickers.item.loopr.last : null,
  balance:balance.items ? balance.items : null,
  marketcap:marketcap.items ? marketcap.items : null,
  preference,trading
}))(PlaceOrderForm)







