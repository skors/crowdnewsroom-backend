import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Button } from "carbon-components-react";
import {authorizedDELETE, authorizedFetch, authorizedPATCH} from "./api";

function InvestigationInvitation({ invitation, acceptCallback }) {
  return (
    <div className="bx--structured-list-row">
      <div className="bx--structured-list-td">
        <div className="cnr--list-header__actions">
          <div className="cnr--list-header">
            <h3 className="cnr--list-header__title">
              Invitation: {invitation.investigation.name}
            </h3>
            <div className="cnr-list-header__action">
              <Button onClick={() => acceptCallback(invitation)}>Accept</Button>
            </div>
          </div>
        </div>
        <ul id="investigation-stats"> </ul>
      </div>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invitations: []
    };
    this.acceptInvitation = this.acceptInvitation.bind(this);
  }

  componentDidMount() {
    this.loadInvitations();
  }

  loadInvitations() {
    authorizedFetch(`/forms/invitations`).then(invitations => {
      this.setState({ invitations });
    });
  }

  acceptInvitation(invitation) {
    authorizedPATCH(`/forms/invitations/${invitation.id}`, {
      body: JSON.stringify({ accepted: true })
    }).then(() => {
      window.location.reload();
    });
  }

  render() {
    const pendingInvitations = this.state.invitations.filter(
      invitation => invitation.accepted === null
    );
    if (!pendingInvitations.length) {
      return <div />;
    }

    return (
      <div className="bx--structured-list">
        <div className="bx--structured-list-tbody">
          {pendingInvitations.map(invitation => (
            <InvestigationInvitation
              invitation={invitation}
              acceptCallback={this.acceptInvitation}
            />
          ))}
        </div>
      </div>
    );
  }
}

window.leaveInvestigation = (investigationSlug, role, userId) => {
  authorizedDELETE(`/forms/investigations/${investigationSlug}/groups/${role}/users/${userId}`).then(() => {
    window.location.reload();
  })
};

const rootElement = document.getElementById("invitation-list");
ReactDOM.render(<App />, rootElement);
