import React from 'react';
import {FillFm} from 'modules/fills/formatters'
import {connect} from 'dva'

const ListMarketFills = ({trades={},maxRows=5})=>{
  // const maxHeight = (60*maxRows+32) + 'px'
  const market = trades.filters.market || 'LRC-WETH'
  const maxHeight = 'auto'
  return (
    <div style={{height:maxHeight,overflow:'auto'}}>
      <table className="w-100 fs13" style={{overflow:'auto'}}>
        <thead>
          <tr className="">
            <th className="zb-b-b bg-grey-100 text-left pl5 pr5 pt5 pb5 font-weight-normal color-black-3 ">Price</th>
            <th className="zb-b-b bg-grey-100 text-right pl5 pr5 pt5 pb5 font-weight-normal color-black-3 ">Amount</th>
            <th className="zb-b-b bg-grey-100 text-right pl5 pr5 pt5 pb5 font-weight-normal color-black-3 ">Fee</th>
            <th className="zb-b-b bg-grey-100 text-right pl5 pr5 pt5 pb5 font-weight-normal color-black-3 ">Time</th>
          </tr>
        </thead>
        <tbody>
            {
              trades.items && trades.items.map((item,index)=>{
                // const fillFm = new FillFm({...item,market})
                return (
                  <tr key={index}>
                    {
                      item.side === 'buy' &&
                      <td className="pl5 pr5 pt10 pb10 zb-b-b text-left align-middle color-green-500">
                        {item.price}
                      </td>
                    }
                    {
                      item.side === 'sell' &&
                      <td className="pl5 pr5 pt10 pb10 zb-b-b text-left align-middle color-red-500">
                        {item.price}
                      </td>
                    }
                    <td className="pl5 pr5 pt10 pb10 zb-b-b color-black-2 text-right align-middle text-nowrap">
                      {item.amount}
                    </td>
                    <td className="pl5 pr5 pt10 pb10 zb-b-b text-right color-black-2 align-middle text-nowrap">
                      {item.lrcFee}
                    </td>
                    <td className="pl5 pr5 pt10 pb10 zb-b-b color-black-2 text-right align-middle text-nowrap">
                      {item.createTime}
                    </td>
                  </tr>
                )
              })
            }
        </tbody>
      </table>
    </div>

  )
}

export default connect(
  ({sockets:{trades}})=>({trades})
)(ListMarketFills)