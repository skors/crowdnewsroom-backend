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
import {authorizedFetch, authorizedPOST} from "./api";
import {ary, partialRight, assign} from "lodash";


const {
  TableContainer,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
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

function Row({row, updateCallback}){
  return <TableRow>
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

const renderTableWithUpdate = (updateCallback) => {
  return ({ rows, headers, getHeaderProps }) => (
    <TableContainer title="Benutzer für Wem Gehört Berlin">
      <Table>
        <TableHead>
          <TableRow>
            {headers.map(header => (
              <TableHeader {...getHeaderProps({ header }) }>
                {header.header}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => <Row key={row.id} row={row} updateCallback={updateCallback} />)}
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

    render() {
      const combinedUsers = this.state.users.concat(this.state.invitations).map(user => {user.id = user.email; return user});
      const headers = [{key: "first_name", header: "Vorname"},
                       {key: "last_name", header: "Nachname"},
                       {key: "email", header: "E-Mail"},
                       {key: "role", header: "Rolle"}];
        return <div>
            <DataTable
                rows={combinedUsers}
                headers={headers}
                render={renderTableWithUpdate(this.updateUserRole)}/>
            <div>
                <InviteUser inviteCallback={this.inviteUser}/>
            </div>
        </div>;
    }
}

const rootElement = document.getElementById("user-management");
ReactDOM.render(<App />, rootElement);
