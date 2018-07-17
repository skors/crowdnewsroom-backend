import React, {Component} from "react";
import ReactDOM from "react-dom";
import {
  DataTable,
  DropdownV2,
  DropdownItem,
  Select,
  SelectItem,
  TextInput,
  Form,
  FormGroup,
  Button, DataTableSkeleton
} from "carbon-components-react";
import {authorizedDELETE, authorizedFetch, authorizedPOST} from "./api";
import {assign, snakeCase, find, endsWith} from "lodash";


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


const getAvailableRoles = (user) => {
  const roles = [
    {id: "A", text: "Admin"},
    {id: "E", text: "Editor"},
    {id: "V", text: "Viewer"},
  ];
  const ownerRole = {id: "O", text: "Owner"};
  if (user.role === "O"){
    roles.unshift(ownerRole)
  }
  return roles;
}

function RoleDropdown({selectedRole, user, updateCallback, availableRoles}) {
  const initialRole = availableRoles.find(role => role.id === selectedRole);

  if (endsWith(selectedRole, "_readonly") || !initialRole){
    const roleKey = selectedRole.substr(0,1);
    const names = {
      "A": "Admin",
      "O": "Owner"
    };
    return <div>{names[roleKey]}</div>
  }

  if (initialRole) {
    return <DropdownV2
      label={"role"}
      onChange={(event) => updateCallback(user, event.selectedItem.id)}
      itemToString={item => item.text}
      initialSelectedItem={initialRole}
      items={availableRoles}
    />
  }
  return <div>Wat?</div>
}

function Row({row, updateCallback, getSelectionProps, availableRoles}){
  return <TableRow>
    <TableSelectRow {...getSelectionProps({ row })} />
    {row.cells.map(cell => <Cell cell={cell}
                                 row={row}
                                 changeUserCallback={updateCallback}
                                 availableRoles={availableRoles}/> )}
  </TableRow>
}

function Cell({cell, row, changeUserCallback, availableRoles}){
  if (cell.info.header === "role") {
    if (cell.value) {
      return <TableCell className={`user-${snakeCase(row.id)}`}>
        <RoleDropdown selectedRole={cell.value}
                      user={row.id}
                      updateCallback={changeUserCallback}
                      availableRoles={availableRoles} />
      </TableCell>
    }
    return <TableCell className={`user-${snakeCase(row.id)}`}><i>Invitation Pending</i></TableCell>;
  }
  return <TableCell key={cell.id}>{cell.value}</TableCell>
}

const renderTableWithUpdate = (updateCallback, removeUsers, availableRoles) => {
  return ({ rows, headers, getHeaderProps, getBatchActionProps, getSelectionProps, selectedRows, onInputChange }) => (
    <TableContainer>
      <TableToolbar>
        <TableBatchActions {...getBatchActionProps()}>
          <TableBatchAction onClick={() => removeUsers(selectedRows)}
                            icon="close"
                            iconDescription="remove">
            Remove
          </TableBatchAction>
        </TableBatchActions>
        <TableToolbarSearch onChange={onInputChange}/>
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
          {rows.map(row => <Row data-id={row.id}
                                key={row.id}
                                row={row}
                                updateCallback={updateCallback}
                                availableRoles={availableRoles}
                                getSelectionProps={getSelectionProps}/>)}
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
          invalidText={this.props.error}
          invalid={this.props.error !== null}
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
            emailError: null,
            currentUser: null,
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
      const handleError = (error) => {
        error.response.json().then(json => {
          if (json.email){
            this.setState({emailError: json.email[0]})
          }
          else {
            const td = document.querySelector(`.user-${snakeCase(email)}`);
            const tr = td.parentElement;
            tr.classList.add("shake");
            setTimeout(() => tr.classList.remove("shake"), 800)
          }
        });
      }

      authorizedPOST(`/forms/investigations/${this.state.slug}/invitations`, {body: JSON.stringify({email})})
        .then(this.setState({emailError: null}))
        .then(this.loadInvitations)
        .catch(handleError);
    }

    loadUsers(){
      authorizedFetch(`/forms/investigations/${this.state.slug}/users`).then(json => {
        const currentUser = json.users.find(user => user.is_requester);
        this.setState({users: json.users, currentUser});
      })
    }

    loadInvitations(){
      authorizedFetch(`/forms/investigations/${this.state.slug}/invitations`).then(invitations => {
        this.setState({invitations: invitations.filter(invitation => invitation.accepted === null)});
      })
    }

    updateUserRole(email, role){
      const userID = find(this.state.users, {email}).id;
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
      const combinedUsers = this.state.users.concat(this.state.invitations);

      if (!combinedUsers.length || !this.state.currentUser){
        return <DataTableSkeleton/>
      }

      const rows = combinedUsers.map(user => {
        const userCopy = assign({}, user, {id: user.email})
        if (userCopy.email === this.state.currentUser.email){
          userCopy.role = `${userCopy.role}_readonly`;
        }
        return userCopy;
      });

      const availableRoles = getAvailableRoles(this.state.currentUser);

      const headers = [{key: "first_name", header: "Vorname"},
                       {key: "last_name", header: "Nachname"},
                       {key: "email", header: "E-Mail"},
                       {key: "role", header: "Rolle"}];
        return <div className="cnr--datatable-overflowable">
            <DataTable
                rows={rows}
                headers={headers}
                render={renderTableWithUpdate(this.updateUserRole, this.removeUsers, availableRoles)}/>
            <div>
                <InviteUser inviteCallback={this.inviteUser} error={this.state.emailError}/>
            </div>
        </div>;
    }
}

const rootElement = document.getElementById("user-management");
ReactDOM.render(<App />, rootElement);
