import React, {Component, PropTypes} from 'react';
import {Link, IndexLink} from 'react-router';
import dmConfig from '../dm_config.json';

class ManageRequest extends Component {

    constructor(props, context) {
        super(props);
        this.context = context;
        var pubKey = localStorage.getItem('pubKey');
        var role = localStorage.getItem('role');
        this.state = {
            role: role,
            pubKey: pubKey
        }
    }

    activeTab(tab) {
        const isActive = this.context.router.isActive(tab);
        return isActive
            ? 'active'
            : '';
    }

    render() {
        return (
            <div className="row">
                {this.state.role == dmConfig.roles.requester
                    ? <ul className="nav nav-tabs">
                            <li className={this.activeTab('requests/new')}>
                                <Link to='requests/new' activeClassName="active">New Request</Link>
                            </li>
                            <li className={this.activeTab('requests/sent')}>
                                <Link to='requests/sent' activeClassName="active">Proposal Sent</Link>
                            </li>
                        </ul>
                    : null
                  }
                {this.state.role == dmConfig.roles.owner
                    ? <ul className="nav nav-tabs">
                            <li className={this.activeTab('requests/mydata')}>
                                <Link to='requests/mydata' activeClassName="active">My Data</Link>
                            </li>
                            <li className={this.activeTab('requests/received')}>
                                <Link to='requests/received' activeClassName="active">Proposal Received</Link>
                            </li>
                        </ul>
                    : null
                  }
                <div id="managerequestcontent">
                    <div className="tab-pane fade in" id="datarequest">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

ManageRequest.contextTypes = {
    router: React.PropTypes.object.isRequired
};

export default ManageRequest;
