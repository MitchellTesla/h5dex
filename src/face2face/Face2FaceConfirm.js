import React from 'react';
import { Input,Icon,Button as WebButton } from 'antd';
import { Modal,List,Button,Accordion,Steps} from 'antd-mobile';
import {toBig, toHex, clearHexPrefix} from 'LoopringJS/common/formatter'
import config from 'common/config'
import intl from 'react-intl-universal';
import * as datas from 'common/config/data'
import eachLimit from 'async/eachLimit';
import * as orderFormatter from 'modules/orders/formatters'
import Notification from 'LoopringUI/components/Notification'
import {createWallet} from 'LoopringJS/ethereum/account';
import * as uiFormatter from 'modules/formatter/common'
import QRCode from 'qrcode.react';
import Alert from 'LoopringUI/components/Alert'
import {Pages,Page} from 'LoopringUI/components/Pages'
import {connect} from 'dva'
import {getTokensByMarket} from 'modules/formatter/common'
import moment from 'moment'

const OrderMetaItem = (props) => {
  const {label, value} = props
  return (
    <div className="row ml0 mr0 pl0 pr0 zb-b-t no-gutters" style={{padding:'7px 0px'}}>
      <div className="col">
        <div className="fs14 color-black-1 lh25 text-left">{label}</div>
      </div>
      <div className="col-auto text-right">
        <div className="fs14 color-black-2 text-wrap lh25 text-left">{value}</div>
      </div>
    </div>
  )
}
function PlaceOrderSteps(props) {
  const {placeOrder, settings, marketcap, dispatch} = props
  const {side, pair, priceInput, amountInput} = placeOrder
  const total = toBig(amountInput).times(toBig(priceInput)).toString(10)
  const tokens = getTokensByMarket(pair)
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
  const next = (page) => {
    let order = {};
    // TODO mock datas
    // order.owner = window.Wallet.getCurrentAccount()
    order.owner = '0xEF68e7C694F40c8202821eDF525dE3782458639f'
    order.delegateAddress = config.getDelegateAddress();
    order.protocol = settings.trading.contract.address;
    const tokenB =  side.toLowerCase() === "buy" ? config.getTokenBySymbol(tokens.left) : config.getTokenBySymbol(tokens.right);
    const tokenS = side.toLowerCase() === "sell" ? config.getTokenBySymbol(tokens.left) : config.getTokenBySymbol(tokens.right);
    order.tokenB = tokenB.address;
    order.tokenS = tokenS.address;
    order.amountB = toHex(toBig(side.toLowerCase() === "buy" ? amountInput : total).times('1e' + tokenB.digits));
    order.amountS = toHex(toBig(side.toLowerCase() === "sell" ? amountInput : total).times('1e' + tokenS.digits));
    const lrcFeeValue = orderFormatter.calculateLrcFee(marketcap, total, 2, tokens.right)
    order.lrcFee = toHex(toBig(lrcFeeValue).times(1e18));
    const validSince = moment().unix()
    const validUntil = moment().add(3600, 'seconds').unix()
    order.validSince = toHex(validSince);
    order.validUntil = toHex(validUntil);
    order.marginSplitPercentage = 50;
    order.buyNoMoreThanAmountB = side.toLowerCase() === "buy";
    order.walletAddress = config.getWalletAddress();
    order.orderType = 'market_order'
    const authAccount = createWallet()
    order.authAddr = authAccount.getAddressString();
    order.authPrivateKey = clearHexPrefix(authAccount.getPrivateKeyString());
    dispatch({type:'placeOrder/rawOrderChange', payload:{rawOrder:order}})
    page.gotoPage({id:'wallet'})
  }
  return (
    <div className="">
        <Pages active="order">
          <Page id="order" render={({page})=>
            <div>
              <div className="p15 color-black-1 fs18 zb-b-b text-center">
                <div className="row">
                  <div className="col-auto text-left" onClick={hideLayer.bind(this,{id:'face2FaceConfirm'})}>
                    <Icon type="close" />
                  </div>
                  <div className="col">Place Order</div>
                  <div className="col-auto color-white">
                    <Icon type="close" />
                  </div>
                </div>
              </div>
              <div className="p20 bg-white">
                <div className="pb20 row ml0 mr0 no-gutters align-items-center justify-content-center">
                  <div className="col-auto">
                    <div className=" color-black-1 text-center" style={{width:"40px",height:'40px',lineHeight:'38px',borderRadius:'50em',border:"1px solid #000"}}>
                      <i className={`icon-${side === 'buy' ? tokens.right : tokens.left} fs24`}/>
                    </div>
                  </div>
                  <div className="col-auto pl25 pr25 text-center">
                    <Icon type="swap" className={`color-black-1 fs20`} />
                  </div>
                  <div className="col-auto">
                    <div className="color-black-1 text-center" style={{width:"40px",height:'40px',lineHeight:'38px',borderRadius:'50em',border:"1px solid #000"}}>
                      <i className={`icon-${side === 'buy' ? tokens.left : tokens.right} fs24`}/>
                    </div>
                  </div>
                </div>
                {
                  side === 'buy' &&
                  <div>
                    <OrderMetaItem label={intl.get(`common.buy`)} value={`${amountInput} ${pair.split('-')[0]}`} />
                    <OrderMetaItem label={intl.get(`common.sell`)} value={`${total} ${pair.split('-')[1]}`} />
                  </div>
                }
                {
                  side === 'sell' &&
                  <div>
                    <OrderMetaItem label={intl.get(`common.sell`)} value={`${amountInput} ${pair.split('-')[0]}`} />
                    <OrderMetaItem label={intl.get(`common.buy`)} value={`${total} ${pair.split('-')[1]}`} />
                  </div>
                }
                <OrderMetaItem label="价格" value={`${priceInput} ${pair.split('-')[1]}`} />
                <OrderMetaItem label="矿工撮合费" value="2.2 LRC" />
                <OrderMetaItem label="订单有效期" value="06-10 10:38 ~ 06-30 10:38" />
                <Button type="" className="bg-grey-900 color-white mt15" onClick={next.bind(this, page)}>签名</Button>
              </div>
            </div>
          }/>
          <Page id="wallet" render={({page})=>
            <div className="div">
              <div className="p15 color-black-1 fs18 zb-b-b text-center no-gutters">
                <div className="row">
                  <div className="col-auto text-left pl20 pr20" onClick={page.gotoPage.bind(this,{id:'order'})}>
                    <Icon type="left"/>
                  </div>
                  <div className="col">Qrcode</div>
                  <div className="col-auto color-white pl20 pr20">
                    <Icon type="left"/>
                  </div>
                </div>
              </div>
              <div className="bg-white p15">
                <img style={{width:'240px',height:'240px'}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAEYCAIAAAAI7H7bAAAFNElEQVR4nO3dQW4jORAAQWux//+y97onYlCTpqrliKthqdVSgocCm6/v7+8v4O/88+4LgE8gJAgICQJCgoCQICAkCAgJAkKCwL+Hv71er2vXkfvUQfPhSzl85Py/DvIXXOL8i7IiQUBIEBASBIQEASFBQEgQEBIEhASB00D2YMm4czbgWzLTXHIPZ/KLX3I3xiNjKxIEhAQBIUFASBAQEgSEBAEhQUBIEBgOZA/yXZCPnv0tmTPOLLn4/b+oLysSJIQEASFBQEgQEBIEhAQBIUFASBDoB7KPtmQb7CNGkPyfFQkCQoKAkCAgJAgICQJCgoCQICAkCBjI/qmbDx+eDX+Ncd/IigQBIUFASBAQEgSEBAEhQUBIEBASBPqB7P4p3s3Rar7l9uBTD8Dd/4v6siJBQkgQEBIEhAQBIUFASBAQEgSEBIHhQDbfjLnf/unkzanr/qc0X2ZFgoCQICAkCAgJAkKCgJAgICQICAkCr0dsP2zt3yG7xKMv/jIrEgSEBAEhQUBIEBASBIQEASFBQEgQ2HKG7M0Nkje3i36qJY9invmJQbMVCQJCgoCQICAkCAgJAkKCgJAgICQInHbILjnJdCYfki65wv2X8anj6fOdtyJBQEgQEBIEhAQBIUFASBAQEgSEBIEtjyxeMsXLzz/dPz+dvdf+n83lj2xFgoCQICAkCAgJAkKCgJAgICQICAkC/SOLb07x8qHbkl2rS97rYM8ktH2vMSsSBIQEASFBQEgQEBIEhAQBIUFASBAYPrJ4yTmh+RUad77rBZewQxbeSUgQEBIEhAQBIUFASBAQEgSEBIHhDtkl+xlvzv5uDn9vvuDM/gH65YdgW5EgICQICAkCQoKAkCAgJAgICQJCgsDHniG7ZGI4s2TOuP8e5lc4fi8rEgSEBAEhQUBIEBASBIQEASFBQEgQGD6yOLfknNCbE8MlL/ipLj+z2ooEASFBQEgQEBIEhAQBIUFASBAQEgSGO2SXPLI4t+Tk2V945Ov+KzyzIkFASBAQEgSEBAEhQUBIEBASBIQEgdMZsrNJ6JKHD8/kF79/zrj/+1py8qxHFsOPExIEhAQBIUFASBAQEgSEBAEhQeA0kL15QGf+grOLX/KRb27UXfKRD5ZsWz6zIkFASBAQEgSEBAEhQUBIEBASBIQEgeEji4dvtmMzZr538qZHTCdbNyfyY1YkCAgJAkKCgJAgICQICAkCQoKAkCBwGsjuH4TtH0Hm93DJXHg/A1l4HiFBQEgQEBIEhAQBIUFASBAQEgSu7pBdYslM8+b23tkLzuw/Q/ZgfPFWJAgICQJCgoCQICAkCAgJAkKCgJAgcDpDdsngcmbJgar79wvf3I1780Zd/iqtSBAQEgSEBAEhQUBIEBASBIQEASFB4DSQPViyr3bJyPjRW1Mfsf90cBk3J/JfViRICAkCQoKAkCAgJAgICQJCgoCQIDAcyB4smTPO3JxOHszea8l5tTen5DdH4XbIwo8TEgSEBAEhQUBIEBASBIQEASFBoB/I7nfz6bj5THPJ3uSZ2Y3K/+vADll4JyFBQEgQEBIEhAQBIUFASBAQEgR+40A2d3N+un8P76M5QxbeSUgQEBIEhAQBIUFASBAQEgSEBIF+IPsLR3Wz/9o/q/3Ur/InWJEgICQICAkCQoKAkCAgJAgICQJCgsBwIHvznND98iNfDy9483jZ3JLtvQceWQzvJCQICAkCQoKAkCAgJAgICQJCgsDLLkj4e1YkCAgJAkKCgJAgICQICAkCQoKAkCAgJAj8B6HZGCr9Rw1/AAAAAElFTkSuQmCC" />
              </div>
            </div>
          }/>
        </Pages>
    </div>
  )
}
function mapToProps(state) {
  return {
    placeOrder:state.placeOrder,
    settings:state.settings,
    marketcap:state.sockets.marketcap.items
  }
}
export default connect(mapToProps)(PlaceOrderSteps)