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
          {rows.map(row => (
            <TableRow key={row.id}>
              {row.cells.map(cell => {
                if (cell.info.header === "role") {
                  return <TableCell>
                  <RoleDropdown selectedRole={cell.value}
                                user={row.id}
                                updateCallback={updateCallback}/>
                  </TableCell>
                }
                return <TableCell key={cell.id}>{cell.value}</TableCell>
                }
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>);
}

function InviteUser() {
  return <Form className="some-class">
    <FormGroup className="some-class" legendText="Benutzer einladen">
      <TextInput
        labelText="Email"
      />
      <Button>Einladen</Button>
    </FormGroup>
    </Form>
}


class App extends Component {
    constructor(props){
        super(props);
        this.state = {
            users: []
        };
        this.updateUserRole = this.updateUserRole.bind(this);
        this.loadUsers = this.loadUsers.bind(this);
    }

    componentDidMount(){
      this.loadUsers()
    }


    loadUsers(){
      const slug = "food-investigation";

      authorizedFetch(`/forms/investigations/${slug}/users`).then(json => {
        this.setState({users: json.users});
      })
    }

    updateUserRole(userID, role){
      const slug = "food-investigation";
      const payload = {id: userID};
      authorizedPOST(`/forms/investigations/${slug}/groups/${role}/users`, {body: JSON.stringify(payload)})
        .then(this.loadUsers)
    }

    render() {
        return <div>
            <DataTable
                rows={this.state.users}
                headers={[{key: "first_name", header: "Vorname"},
                    {key: "last_name", header: "Nachname"},
                    {key: "email", header: "E-Mail"},
                    {key: "role", header: "Rolle"}]}
                render={renderTableWithUpdate(this.updateUserRole)}/>
            <div>
                <InviteUser/>
            </div>
        </div>;
    }
}

const rootElement = document.getElementById("user-management");
ReactDOM.render(<App />, rootElement);
