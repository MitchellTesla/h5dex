import React from 'react'
import { List, InputItem,Button,WingBlank,Slider, Tabs, WhiteSpace, Badge,SegmentedControl, NavBar, Icon,Modal,Switch,Steps } from 'antd-mobile'
import { Icon as WebIcon,Switch as WebSwitch } from 'antd'
import { connect } from 'dva'
import routeActions from 'common/utils/routeActions'
import LayoutDexHome from '../../layout/LayoutDexHome'
import {getTokensByMarket} from 'modules/formatter/common'
import HelperOfMyMarketOrders from './HelperOfMyMarketOrders'
import HelperOfMyMarketFills from './HelperOfMyMarketFills'
import HelperOfBalance from './HelperOfBalance'
import HelperOfFAQ from './HelperOfFAQ'
import PlaceOrderForm from './PlaceOrderForm'
import {toBig,toHex,getDisplaySymbol} from 'LoopringJS/common/formatter'
import intl from 'react-intl-universal';

const Item = List.Item;
class PlaceOrderPage extends React.Component {
  render() {
    const {dispatch,placeOrder} = this.props
    const {side,pair} = placeOrder
    const params = routeActions.match.getParams(this.props)
    if(!params.market) {
      if(!pair){
        const defaultMarket = "LRC-WETH" // TODO
        routeActions.gotoPath(`/dex/placeOrder/${defaultMarket}`)
      }else{
        routeActions.gotoPath(`/dex/placeOrder/${pair}`)
      }
    }
    const pairTokens = getTokensByMarket(pair)
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
    const sideChange = (side)=>{
      dispatch({
        type:'placeOrder/sideChangeEffects',
        payload:{
          side
        }
      })
   }

    const gotoTrade = ()=>{
      routeActions.gotoPath(`/dex/markets/${pair}`)
    }

    const tabChange = (tab) => {
      if(tab === 'fills') {
        dispatch({type:"fills/fetch", payload:{id:"MyFills"}})
      }
    }

    return (
      <LayoutDexHome {...this.props}>
        <div className="bg-grey-100">
          <NavBar
            className=""
            mode="light"
            leftContent={[
              <span onClick={routeActions.goBack} className="color-black-1" key="1"><WebIcon type="left" /></span>,
            ]}
            rightContent={[
              <span className="color-black-1" key="1"  onClick={() => routeActions.gotoPath(`/dex/markets/${pair}`) }><WebIcon type="line-chart" /></span>
            ]}
          >
            <div onClick={showLayer.bind(this,{id:'helperOfMarket'})}>
              {pair}<WebIcon className="ml5" type="down" />
            </div>
          </NavBar>
          <div className="divider 1px zb-b-t"></div>
          <div className="no-underline tabs-no-border h-50 place-order-form">
            {
              false &&
              <Tabs
                tabs={
                  [
                    { title: <div className="fs16">{intl.get("common.buy")} {pairTokens.left}</div> },
                    { title: <div className="fs16">{intl.get("common.sell")} {pairTokens.left}</div> },
                  ]
                }
                tabBarBackgroundColor={null && (side === 'buy' ? "#e8f5e9" : "#ffebee")}
                tabBarActiveTextColor={null && (side === 'buy' ? "#43a047" : "#f44336")}
                tabBarInactiveTextColor={"rgba(0,0,0,0.3)"}
                tabBarTextStyle={{}}
                swipeable={false}
                initialPage={side==='buy'?0:1}
                onChange={(tab, index) => { sideChange(index==0 ? 'buy' : 'sell')}}
                onTabClick={(tab, index) => { }}
              >

              </Tabs>
            }
            <PlaceOrderForm side="sell" showLayer={showLayer} />
          </div>
          <div className="tabs-no-border">
            <Tabs
              tabs={
                [
                  { title: <div className="am-tabs-item-bak-wrapper"><div className="fs16 am-tabs-item-bak">{intl.get("place_order.assets")}</div></div>, tab:'assets' },
                  { title: <div className="am-tabs-item-bak-wrapper"><div className="fs16 am-tabs-item-bak">{intl.get("place_order.orders")}</div></div>, tab:'orders' },
                  { title: <div className="am-tabs-item-bak-wrapper"><div className="fs16 am-tabs-item-bak">{intl.get("place_order.fills")}</div></div>, tab:'fills' },
                  { title: <div className="am-tabs-item-bak-wrapper"><div className="fs16 am-tabs-item-bak">{intl.get("place_order.help")}</div></div>, tab:'help' },
                ]
              }
              initialPage={0}
              swipeable={false}
              onChange={(tab, index) => tabChange(tab.tab)}
              onTabClick={(tab, index) => { console.log('onTabClick', index, tab); }}
            >
              <div className="zb-b-t">
                <HelperOfBalance />
              </div>
              <div className="zb-b-t">
                <HelperOfMyMarketOrders />
              </div>
              <div className="zb-b-t">
                <HelperOfMyMarketFills />
              </div>
              <div className="zb-b-t">
                 <HelperOfFAQ />
              </div>
            </Tabs>
            <div className="pb50"></div>
          </div>
        </div>
      </LayoutDexHome>
    );
  }
}
export default connect(({placeOrder})=>({placeOrder}))(PlaceOrderPage)





