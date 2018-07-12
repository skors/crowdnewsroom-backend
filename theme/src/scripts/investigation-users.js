import React, {Component} from "react";
import ReactDOM from "react-dom";
import { DataTable,
 DropdownV2,
 DropdownItem,
 Select,
 SelectItem,
 TextInput,
 Form,
 FormGroup,
 Button } from "carbon-components-react";
import {authorizedDELETE, authorizedFetch, authorizedPOST} from "./api";
import {assign} from "lodash";


const {
  TableContainer,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  TableToolbar,
  TableBatchActions,
  TableBatchAction,
  TableSelectRow,
  TableSelectAll,
  TableToolbarSearch,
} = DataTable;

const ROLES = [
  {id: "O", text: "Owner"},
  {id: "A", text: "Admin"},
  {id: "E", text: "Editor"},
  {id: "V", text: "Viewer"},
];

function RoleDropdown({selectedRole, user, updateCallback}) {
  return <DropdownV2
    label={"role"}
    onChange={(event) => updateCallback(user, event.selectedItem.id)}
    itemToString={item => item.text}
    initialSelectedItem={ROLES.find(role => role.id === selectedRole)}
    items={ROLES}
    />
}

function Row({row, updateCallback, getSelectionProps}){
  return <TableRow>
    <TableSelectRow {...getSelectionProps({ row })} />
    {row.cells.map(cell => <Cell cell={cell} row={row} changeUserCallback={updateCallback}/> )}
  </TableRow>
}

function Cell({cell, row, changeUserCallback}){
  if (cell.info.header === "role") {
    if (cell.value) {
      return <TableCell>
        <RoleDropdown selectedRole={cell.value}
                      user={row.id}
                      updateCallback={changeUserCallback}/>
      </TableCell>
    }
    return <TableCell><i>Invitation Pending</i></TableCell>;
  }
  return <TableCell key={cell.id}>{cell.value}</TableCell>
}

const renderTableWithUpdate = (updateCallback, removeUsers) => {
  return ({ rows, headers, getHeaderProps, getBatchActionProps, getSelectionProps, selectedRows }) => (
    <TableContainer>
      <TableToolbar>
        <TableBatchActions {...getBatchActionProps()}>
          <TableBatchAction onClick={() => removeUsers(selectedRows)}
                            icon="close"
                            iconDescription="remove">
            Remove
          </TableBatchAction>
        </TableBatchActions>
        <TableToolbarSearch />
      </TableToolbar>
      <Table>
        <TableHead>
          <TableRow>
            <TableSelectAll {...getSelectionProps()} />
            {headers.map(header => (
              <TableHeader {...getHeaderProps({ header }) }>
                {header.header}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => <Row key={row.id} row={row} updateCallback={updateCallback} getSelectionProps={getSelectionProps}/>)}
        </TableBody>
      </Table>
    </TableContainer>);
}

class InviteUser extends Component {
  constructor(props){
    super(props);
    this.state = {email: ""};

    this.updateEmail = this.updateEmail.bind(this);
    this.submit = this.submit.bind(this);
  }

  updateEmail(event){
    this.setState({email: event.target.value});
  }

  submit(event){
    event.preventDefault();
    this.props.inviteCallback(this.state.email)
  }

  render() {
    return <Form onSubmit={this.submit}>
      <FormGroup legendText="Benutzer einladen">
        <TextInput
          labelText="Email"
          value={this.state.email}
          onChange={this.updateEmail}
        />
        <Button onClick={this.submit}>Einladen</Button>
      </FormGroup>
    </Form>
  }
}

function removeUser(user, investigationSlug) {
  return authorizedDELETE(`/forms/investigations/${investigationSlug}/groups/${user.role}/users/${user.id}`)
}

function removeInvitation(invitation) {
  return authorizedDELETE(`/forms/invitations/${invitation.id}`)
}

class App extends Component {
    constructor(props){
        super(props);
        const [match, slug] = window.location.pathname.match(/investigations\/([a-z-]+)\/users/);
        this.state = {
            users: [],
            invitations: [],
            slug
        };
        this.updateUserRole = this.updateUserRole.bind(this);
        this.loadUsers = this.loadUsers.bind(this);
        this.loadInvitations = this.loadInvitations.bind(this);
        this.inviteUser = this.inviteUser.bind(this);
        this.removeUsers = this.removeUsers.bind(this);
    }

    componentDidMount(){
      this.loadUsers();
      this.loadInvitations();
    }

    inviteUser(email){
      console.log(email);
      authorizedPOST(`/forms/investigations/${this.state.slug}/invitations`, {body: JSON.stringify({email})}).then(this.loadInvitations);
    }

    loadUsers(){
      authorizedFetch(`/forms/investigations/${this.state.slug}/users`).then(json => {
        this.setState({users: json.users});
      })
    }

    loadInvitations(){
      authorizedFetch(`/forms/investigations/${this.state.slug}/invitations`).then(users => {
        this.setState({invitations: users});
      })
    }

    updateUserRole(userID, role){
      const payload = {id: userID};
      authorizedPOST(`/forms/investigations/${this.state.slug}/groups/${role}/users`, {body: JSON.stringify(payload)})
        .then(this.loadUsers)
    }

    removeUsers(users){
      const userEmails = users.map(user => user.id);
      const selectedUsers = this.state.users.filter(user => userEmails.indexOf(user.email) !== -1);
      const selectedInvitations = this.state.invitations.filter(user => userEmails.indexOf(user.email) !== -1)

      const removeUserPromises = selectedUsers.map(user => removeUser(user, this.state.slug));
      Promise.all(removeUserPromises).then(this.loadUsers);

      const removeInvitationPromises = selectedInvitations.map(invitation => removeInvitation(invitation));
      Promise.all(removeInvitationPromises).then(this.loadInvitations);
    }


    render() {
      const combinedUsers = this.state.users.concat(this.state.invitations).map(user => assign({}, user, {id: user.email}));
      const headers = [{key: "first_name", header: "Vorname"},
                       {key: "last_name", header: "Nachname"},
                       {key: "email", header: "E-Mail"},
                       {key: "role", header: "Rolle"}];
        return <div className="cnr--datatable-overflowable">
            <DataTable
                rows={combinedUsers}
                headers={headers}
                render={renderTableWithUpdate(this.updateUserRole, this.removeUsers)}/>
            <div>
                <InviteUser inviteCallback={this.inviteUser}/>
            </div>
        </div>;
    }
}

const rootElement = document.getElementById("user-management");
ReactDOM.render(<App />, rootElement);
