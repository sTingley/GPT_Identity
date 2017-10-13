import React from 'react';
import { render } from 'react-dom';
import { VictoryPie } from 'victory';
import { VictoryChart } from 'victory';
import { VictoryBar } from 'victory';
import { VictoryTheme } from 'victory';
import { VictoryLabel } from 'victory';
import { VictoryAxis } from 'victory';
import GoogleMapReact from 'google-map-react';
// import Marker from 'react-google-maps';

class Dashboard extends React.Component {
    render() {
        var cardStyle1 = {
            width: '800px', marginTop: '30px'

        }
        var cardStyle2 = {
            width: '420px'

        }
        var cardStyle3 = {
            border: '2px solid #e05d6f ',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            background: 'linear-gradient(60deg, #ef5350 , #e53935 )',
            borderRadius: '2%', height: '209px', width: '32%', float: 'left', cursor: 'pointer', textAlign: 'center',
            paddingTop: '44px', fontSize: '18px', color: '#fff ', fontWeight: 'bold'

        }
        var cardNum1 = {
            fontSize: '62px'

        }
        var cardStyle4 = {
            border: '2px solid #66bb6a ',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            background: 'linear-gradient(60deg, #66bb6a , #43a047 )',
            borderRadius: '2%', height: '209px', marginLeft: '7px', width: '32%', float: 'left', cursor: 'pointer',
            textAlign: 'center',
            paddingTop: '44px', fontSize: '18px', color: '#fff ', fontWeight: 'bold'

        }
        var cardStyle5 = {
            border: '2px solid #26c6da ',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            background: 'linear-gradient(60deg, #26c6da , #00acc1 )', borderRadius: '2%',
            height: '209px', marginLeft: '7px', width: '32%', float: 'left', cursor: 'pointer',
            textAlign: 'center',
            paddingTop: '44px', fontSize: '18px', color: '#fff ', fontWeight: 'bold'

        }
        let style = {
            backgroundColor: '#aaaaaa',
            width: '103%',
            height: '300px',


        }

        let maprops = {
            center: { lat: 43.680039, lng: -79.417076 },
            zoom: 11,
            title:'The marker`s title will appear as a tooltip.',
            name:'SOMA',
            position:{lat: 37.778519, lng: -122.405640}


        };

        // const data = [
        // {quarter: 1, earnings: 13000},
        // {quarter: 2, earnings: 16500},
        // {quarter: 3, earnings: 14250},
        // {quarter: 4, earnings: 19000}
        // ];

        return (

            <div>
                <div className="row">

                    <div className="col-xs-7">

                        <div style={cardStyle3} data-toggle="modal" data-target="#myModal">
                            High Risk
                   <div style={cardNum1}> 08</div>
                        </div>

                        <div style={cardStyle4} data-toggle="modal" data-target="#myModal2">
                            Moderate Risk
                   <div style={cardNum1}> 04</div>
                        </div>

                        <div style={cardStyle5} data-toggle="modal" data-target="#myModal3">

                            Low Risk
                   <div style={cardNum1}> 02</div>

                        </div>

                    </div>
                    <div className="col-xs-5 speedo-shadow"><img src="./img/screenshot2.png" style={cardStyle2} /></div>

                </div><br></br>

                <div className="row speedo-shadow" style={style}>
                    <GoogleMapReact
                        center={maprops.center}
                        defaultZoom={maprops.zoom}
                       
                        
                    >
                    {/* {props.isMarkerShown && <Marker position={{ lat: -34.397, lng: 150.644 }} />} */}
                    </GoogleMapReact>
                    {/* <Marker
                        /> */}
                    
                </div>
                <div className="centered tooltip">
                    <span className="tooltiptext">#4a8s756haf</span>
                </div>
                <div className="centered1 tooltip">
                    <span className="tooltiptext">#892a8s756haf</span>
                </div>
                <div className="centered2 tooltip">
                    <span className="tooltiptext">#6s8s756haf</span>
                </div>
                <div className="centered3 tooltip">
                    <span className="tooltiptext">#8ea8s756haf</span>
                </div>
                <div className="centered4 tooltip">
                    <span className="tooltiptext">#4a8s756haf</span>
                </div>
                <div className="centered5 tooltip">
                    <span className="tooltiptext">#64a8s756haf</span>
                </div>
                <div className="centered6 tooltip">
                    <span className="tooltiptext">#54a8s756haf</span>
                </div>
                <div className="centered7 tooltip">
                    <span className="tooltiptext">#97a8s756haf</span>
                </div>
                <div className="centered8 tooltip">
                    <span className="tooltiptext">#89a8s756haf</span>
                </div>

                <div className="modal fade out" id="myModal" role="dialog"> 
                    <div className="modal-dialog">

                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">High Risk</h4>
                            </div>
                            <div className="modal-body" >
                                <table className="table table-hover table-bordered" height={100}>
                                    <thead>
                                        <tr><th>Asset</th><th>Owner</th><th>Location</th></tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>12345</td>
                                            <td>John</td>
                                            <td>NewYork</td>
                                        </tr>
                                        <tr><td>12345</td><td>Spencer</td><td>NewYork</td></tr>
                                        <tr><td>12345</td><td>Shane</td><td>NewYork</td></tr>
                                    </tbody>
                                </table>

                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    //padding={{ top: 80, bottom: 80 }}
                                    height={200}

                                    index={2}


                                >



                                    <VictoryBar horizontal
                                        style={{
                                            data: { fill: "#c43a31" },


                                        }}

                                    />


                                    {/* <VictoryLabel 
   stlye={{data:{x:"x axis"},
   }}/> */}

                                    <VictoryAxis

                                        label="Destruction"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },



                                            tickLabels: { padding: 5 }

                                        }}

                                    />

                                    <VictoryAxis dependentAxis

                                        label="Asset"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },



                                            tickLabels: { padding: 5 }

                                        }}

                                    />
                                </VictoryChart>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* code for modal popup2 */}

                <div className="modal fade out" id="myModal2" role="dialog">
                    <div className="modal-dialog">


                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">Moderate Risk</h4>
                            </div>
                            <div className="modal-body" >
                                <table className="table table-hover table-bordered" height={100}>
                                    <thead>
                                        <tr><th>Asset</th><th>Owner</th><th>Location</th></tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>12345</td>
                                            <td>John</td>
                                            <td>NewYork</td>
                                        </tr>
                                        <tr><td>12345</td><td>Spencer</td><td>NewYork</td></tr>
                                        <tr><td>12345</td><td>Shane</td><td>NewYork</td></tr>
                                    </tbody>
                                </table>

                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    //padding={{ top: 80, bottom: 80 }}
                                    height={200}

                                    index={2}


                                >



                                    <VictoryBar horizontal
                                        style={{
                                            data: { fill: "#43a047" },


                                        }}

                                    />


                                    {/* <VictoryLabel 
   stlye={{data:{x:"x axis"},
   }}/> */}

                                    <VictoryAxis

                                        label="Destruction"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },

                                            tickLabels: { padding: 5 },


                                        }}

                                    />

                                    <VictoryAxis dependentAxis

                                        label="Asset"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },



                                            tickLabels: { padding: 5 }

                                        }}

                                    />
                                </VictoryChart>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* code for modal popup3 */}

                <div className="modal fade out" id="myModal3" role="dialog">
                    <div className="modal-dialog">

                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal">&times;</button>
                                <h4 className="modal-title">Low Risk</h4>
                            </div>
                            <div className="modal-body" >
                                <table className="table table-hover table-bordered" height={100}>
                                    <thead>
                                        <tr><th>Asset</th><th>Owner</th><th>Location</th></tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>12345</td>
                                            <td>John</td>
                                            <td>NewYork</td>
                                        </tr>
                                        <tr><td>12345</td><td>Spencer</td><td>NewYork</td></tr>
                                        <tr><td>12345</td><td>Shane</td><td>NewYork</td></tr>
                                    </tbody>
                                </table>

                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    //padding={{ top: 80, bottom: 80 }}
                                    height={200}

                                    index={2}


                                >



                                    <VictoryBar horizontal
                                        style={{
                                            data: { fill: "#00acc1" },


                                        }}

                                    />


                                    {/* <VictoryLabel 
   stlye={{data:{x:"x axis"},
   }}/> */}

                                    <VictoryAxis

                                        label="Destruction"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },



                                            tickLabels: { padding: 5 }

                                        }}

                                    />

                                    <VictoryAxis dependentAxis

                                        label="Asset"

                                        style={{

                                            axis: { stroke: "#756f6a" },

                                            axisLabel: { fontSize: 10, padding: 30 },



                                            tickLabels: { padding: 5 }

                                        }}

                                    />
                                </VictoryChart>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

        );

    }
}

export default Dashboard;