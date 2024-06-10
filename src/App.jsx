import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardMedia,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Menu as MenuIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import logo from './assets/federal-svg.svg';
  import LoginPage from './LoginPage';
import './App.css';

// User Creation Modal
const UserCreationModal = ({ isOpen, onClose, onSubmit, user }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedUser = Object.fromEntries(formData.entries());
    updatedUser.tasks = user ? user.tasks : []; // Initialize tasks if not editing
    onSubmit(updatedUser);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            type="text"
            name="name"
            defaultValue={user ? user.name : ''}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            name="email"
            defaultValue={user ? user.email : ''}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Username"
            type="text"
            name="username"
            defaultValue={user ? user.username : ''}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Phone"
            type="text"
            name="phone"
            defaultValue={user ? user.phone : ''}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Website"
            type="text"
            name="website"
            defaultValue={user ? user.website : ''}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
          <Button type="submit" color="primary">
            {user ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Task Creation Modal
const TaskCreationModal = ({ isOpen, onClose, onSubmit, task, userId }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedTask = Object.fromEntries(formData.entries());
    updatedTask.completed = formData.get('completed') === 'on';
    updatedTask.userId = userId;
    onSubmit(updatedTask);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            label="Title"
            type="text"
            name="title"
            defaultValue={task ? task.title : ''}
            fullWidth
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              defaultValue={task ? task.status : 'To Do'}
              required
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox name="completed" defaultChecked={task ? task.completed : false} />}
            label="Completed"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
          <Button type="submit" color="primary">
            {task ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const UserCard = ({ user, onDelete, onEdit, onCreateTask, onDeleteTask, onEditTask, onStatusChange }) => (
  <Card sx={{ marginBottom: 2 }}>
    <CardContent>
      <Typography variant="h5">{user.name}</Typography>
      <Typography variant="body1">Email: {user.email}</Typography>
      <Typography variant="body1">Username: {user.username}</Typography>
      <Typography variant="body1">Phone: {user.phone}</Typography>
      <Typography variant="body1">Website: {user.website}</Typography>
      <IconButton onClick={() => onEdit(user)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => onDelete(user.id)}>
        <DeleteIcon />
      </IconButton>
      <Button onClick={() => onCreateTask(user.id)}>Add Task</Button>
      {user.tasks && user.tasks.length > 0 && (
        <Grid container spacing={2}>
          {user.tasks.map(task => (
            <Grid item xs={12} key={task.id}>
              <TaskCard
                task={task}
                onDelete={() => onDeleteTask(user.id, task.id)}
                onEdit={() => onEditTask(user.id, task)}
                onStatusChange={() => onStatusChange(user.id, task)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </CardContent>
  </Card>
);

const TaskCard = ({ task, onDelete, onEdit, onStatusChange }) => (
  <Card sx={{ marginBottom: 2 }}>
    <CardContent>
      <Typography variant="h5">{task.title}</Typography>
      <FormControlLabel
        control={<Checkbox checked={task.completed} onChange={onStatusChange} />}
        label="Completed"
      />
      <Typography variant="body2">Status: {task.status}</Typography>
      <IconButton onClick={onEdit}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </CardContent>
  </Card>
);

const App = () => {
  const [page, setPage] = useState('home');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (page !== 'home') {
      fetchData(page);
    }
  }, [page]);

  const fetchData = (type) => {
    let url;
    if (type === 'products') {
      url = 'https://fakestoreapi.com/products';
    } else {
      url = `https://jsonplaceholder.typicode.com/${type}`;
    }

    if (searchQuery) {
      url += `?q=${searchQuery}`;
    }

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (type === 'users') {
          data = data.map(user => ({ ...user, tasks: [] })); // Initialize tasks for each user
        }
        setData(data);
      });
  };

  const renderPage = () => {
    const paginatedData = data.slice(0, rowsPerPage);

    if (page === 'users') {
      return (
        <Grid container spacing={2}>
          {paginatedData.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <UserCard
                user={user}
                onDelete={handleUserDelete}
                onEdit={handleUserEdit}
                onCreateTask={handleTaskCreate}
                onDeleteTask={handleTaskDelete}
                onEditTask={handleTaskEdit}
                onStatusChange={handleStatusChange}
              />
            </Grid>
          ))}
        </Grid>
      );
    } else if (page === 'products') {
      return (
        <Grid container spacing={2}>
          {paginatedData.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={product.image}
                  alt={product.title}
                />
                <CardContent>
                  <Typography variant="h5" component="div">
                    {product.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    ${product.price}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }
  };

  const handleUserModalOpen = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleUserModalClose = () => {
    setEditingUser(null);
    setIsUserModalOpen(false);
  };

  const handleUserSubmit = (user) => {
    const updatedData = editingUser
      ? data.map(u => (u.id === user.id ? user : u))
      : [...data, { ...user, id: Date.now(), tasks: [] }];

    setData(updatedData);
    setSnackbarMessage(editingUser ? 'User updated successfully' : 'User created successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleUserDelete = (userId) => {
    const updatedData = data.filter(user => user.id !== userId);
    setData(updatedData);
    setSnackbarMessage('User deleted successfully');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  const handleUserEdit = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleTaskModalOpen = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const handleTaskCreate = (userId) => {
    setCurrentUserId(userId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskEdit = (userId, task) => {
    setCurrentUserId(userId);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = (task) => {
    const updatedData = data.map(user => {
      if (user.id === task.userId) {
        const updatedTasks = editingTask
          ? user.tasks.map(t => (t.id === task.id ? task : t))
          : [...user.tasks, { ...task, id: Date.now() }];

        return { ...user, tasks: updatedTasks };
      }
      return user;
    });

    setData(updatedData);
    setSnackbarMessage(editingTask ? 'Task updated successfully' : 'Task created successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleTaskDelete = (userId, taskId) => {
    const updatedData = data.map(user => {
      if (user.id === userId) {
        const updatedTasks = user.tasks.filter(task => task.id !== taskId);
        return { ...user, tasks: updatedTasks };
      }
      return user;
    });

    setData(updatedData);
    setSnackbarMessage('Task deleted successfully');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  };

  const handleStatusChange = (userId, taskId) => {
    const updatedData = data.map(user => {
      if (user.id === userId) {
        const updatedTasks = user.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, completed: !task.completed };
          }
          return task;
        });
        return { ...user, tasks: updatedTasks };
      }
      return user;
    });

    setData(updatedData);
    setSnackbarMessage('Task status updated successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleSidebar}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                React App
              </Typography>
              {page === 'users' && (
                <Button color="inherit" onClick={handleUserModalOpen}>
                  Add User
                </Button>
              )}
            
            </Toolbar>
          </AppBar>
          <Drawer variant="persistent" anchor="left" open={sidebarVisible}>
            <List>
              <ListItem button onClick={() => handlePageChange('home')}>
                <ListItemText primary="Home" />
              </ListItem>
              <ListItem button onClick={() => handlePageChange('users')}>
                <ListItemText primary="Users" />
              </ListItem>
              <ListItem button onClick={() => handlePageChange('products')}>
                <ListItemText primary="Products" />
              </ListItem>
            </List>
          </Drawer>
          <Container sx={{ marginTop: 2, marginLeft: sidebarVisible ? 25 : 0 }}>
            {page === 'home' ? (
              <div>
                <Typography variant="h2">Welcome to the React App</Typography>
                <img src={logo} className="App-logo" alt="logo" />
              </div>
            ) : (
              renderPage()
            )}
          </Container>
          <UserCreationModal
            isOpen={isUserModalOpen}
            onClose={handleUserModalClose}
            onSubmit={handleUserSubmit}
            user={editingUser}
          />
          <TaskCreationModal
            isOpen={isTaskModalOpen}
            onClose={handleTaskModalClose}
            onSubmit={handleTaskSubmit}
            task={editingTask}
            userId={currentUserId}
          />
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      ) : (
        <LoginPage setIsAuthenticated={setIsAuthenticated} />
      )}
    </div>
  );
};

export default App;
