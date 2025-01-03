import React, { useEffect, useState } from 'react';
import ManagerSideBar from '../../../layouts/components/ManagerSideBar';
import Box from '@mui/material/Box';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import ModalForm from './CarForm';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import WarningIcon from '@mui/icons-material/Warning';
import { cdmApi } from '../../../misc/cdmApi';

const ManageCarPage = () => {
  const [rows, setRows] = useState([]);
  const [dataChangeFlag, setDataChangeFlag] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [rowToEdit, setRowToEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await cdmApi.getAllCars();
        const indexedData = response.data.content.map((row, index) => ({
          ...row,
          index: index + 1,
        }));
        setRows(indexedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [dataChangeFlag]);

  const handleCloseSnackbar = () => setSnackbar(null);

  const handleSubmit = (newFormState) => {
    const message =
      rowToEdit === null
        ? 'Do you really want to create a new car?'
        : "Do you really want to update the car's information?";
    setPopupMessage(message);
    setPopupOpen(true);
    
    // Store the form state temporarily. We'll use it in handleYes
    setRowToEdit(rowToEdit ? {...rowToEdit, ...newFormState} : newFormState); 
  };

  const handleNo = () => {
    setDeletingId(null);
    setPopupOpen(false);
    setRowToEdit(null); 
  };

  const handleYes = async () => {
    setPopupOpen(false);
    if (deletingId !== null) {
      handleDeleteApi();
    } else {
      try {
          const formData = new FormData();
          formData.append("file", rowToEdit.imgSrc);
          formData.append("upload_preset", "xuanlinh");
  
          const resUpload = await axios.post(
            "https://api.cloudinary.com/v1_1/dqfhfd7ts/image/upload",
            formData
          );
          
          const updatedFormState = { ...rowToEdit, imgSrc: resUpload.data.secure_url };
          delete updatedFormState.index;
          if (rowToEdit.id) {
            handleUpdateApi(updatedFormState);
          } else {
            handleCreateApi(updatedFormState);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          setSnackbar({
            children: "Couldn't upload image",
            severity: "error",
          });
        }
    }
  };

  const handleCreateApi = async (formState) => {
    try {
      const response = await cdmApi.createCar(formState);
      setRows([...rows, response.data]);
      setSnackbar({
        children: 'Car created successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error creating car:', error);
      setSnackbar({ children: "Couldn't create car", severity: 'error' });
    } finally {
      setDataChangeFlag(!dataChangeFlag);
      setModalOpen(false);
    }
  };

  const handleUpdateApi = async (formState) => {
    try {
      const response = await cdmApi.updateCar(formState);
      setRows(
        rows.map((row) => (row.id === formState.id ? response.data : row))
      );
      setSnackbar({
        children: 'Car updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating car:', error);
      setSnackbar({ children: "Couldn't update car", severity: 'error' });
    } finally {
      setDataChangeFlag(!dataChangeFlag);
      setModalOpen(false);
      setRowToEdit(null);
    }
  };

  const handleDeleteApi = async () => {
    try {
      await cdmApi.deleteCar(deletingId);
      setRows(rows.filter((row) => row.id !== deletingId));
      setSnackbar({
        children: 'Car deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting car:', error);
      setSnackbar({ children: "Couldn't delete car", severity: 'error' });
    } finally {
      setDataChangeFlag(!dataChangeFlag);
      setDeletingId(null);
    }
  };

  const renderConfirmDialog = () => (
    <Dialog maxWidth="xs" open={popupOpen}>
      <DialogTitle>
        <WarningIcon className="text-yellow-500 mx-auto" sx={{ fontSize: 50 }} />
      </DialogTitle>
      <DialogContent dividers>
        {popupMessage}
      </DialogContent>
      <DialogActions>
        <div className="flex gap-6">
          <button
            className="bg-white border-2 border-gray-400 hover:bg-gray-400 hover:text-white dark:hover:bg-gray-600 rounded-md text-black dark:text-white font-medium w-12 py-1.5"
            onClick={handleNo}
          >
            No
          </button>
          <button
            className="text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md font-medium w-12 py-1.5"
            onClick={handleYes}
          >
            Yes
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );

  const handleEditClick = (id) => () => {
    setRowToEdit(rows.find((row) => row.id === id));
    setModalOpen(true);
  };

  const handleDeleteClick = (id) => () => {
    setDeletingId(id);
    setPopupMessage('Do you really want to delete this car?');
    setPopupOpen(true);
  };

  const columns = [
    {
      field: 'index',
      headerName: 'ID',
      width: 50,
      renderCell: (params) => params.row.index,
    },
    {
      field: 'imgSrc',
      headerName: 'Car',
      width: 150,
      renderCell: (params) => (
        <div>
          {params.row.imgSrc && (
            <img
              className="w-32 rounded-md object-cover -ml-4"
              src={params.row.imgSrc}
              alt="avatar"
            />
          )}
        </div>
      ),
    },
    {
      field: 'trim',
      headerName: 'Name',
      width: 210,
    },
    {
      field: 'orgPrice',
      headerName: 'Original Price',
      width: 120,
    },
    {
      field: 'disPrice',
      headerName: 'Discounted Price',
      width: 130,
    },
    {
      field: 'tech',
      headerName: 'Technology',
      width: 100,
    },

    {
      field: 'count',
      headerName: 'Quantity',
      width: 90,
    },

    {
      field: 'model',
      headerName: 'Model',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 80,
      getActions: ({ id }) => [
        <GridActionsCellItem
          icon={
            <EditIcon
              className="bg-gray-800 text-white rounded-md p-1 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-500"
            />
          }
          label="Edit"
          onClick={handleEditClick(id)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={
            <DeleteIcon
              className="bg-red-600 text-white rounded-md p-1 hover:bg-red-400 dark:bg-red-700 dark:hover:bg-red-500"
            />
          }
          label="Delete"
          onClick={handleDeleteClick(id)}
          color="inherit"
        />,
      ],
    },
  ];

  return (
    <div className="flex dark:bg-gray-900">
      <ManagerSideBar />
      {modalOpen && (
        <ModalForm
          closeModel={() => {
            setModalOpen(false);
            setRowToEdit(null);
          }}
          defaultValues={rowToEdit}
          onSubmit={handleSubmit}
        />
      )}
      <div className="ml-8 flex-1 flex flex-col overflow-x-hidden">
        <div className="pt-8 w-full">
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">Car</p>
        </div>
        <button
          className="self-end mr-12 mb-0 bg-gray-800 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-500 rounded-md text-white font-bold w-36 my-2 py-2"
          onClick={() => setModalOpen(true)}
        >
          CREATE NEW
        </button>

        <div className="mt-4">
          {renderConfirmDialog()}
          <Box
            height="544px"
            width="100%"
            maxWidth="100%"
            sx={{
              '& .MuiDataGrid-root': {
                border: 'none',
                backgroundColor: 'white',
                borderRadius: '8px',
                '.dark &': {
                    backgroundColor: '#272727',
                  },
              },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
                fontSize: '12px',
                color: 'black',
                '.dark &': {
                    color: 'white',
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#607286',
                color: '#fff',
                borderBottom: 'none',
                fontSize: '14px',
                borderRadius: '8px 8px 0 0',
                '.dark &': {
                    backgroundColor: '#474747',
                }
              },
              '& .MuiDataGrid-footerContainer': {
                borderRadius: '0 0 8px 8px',
              },
              '& .MuiDataGrid-virtualScroller': {
              },
              '& .MuiDataGrid-row--editing .MuiDataGrid-cell': {
                boxShadow:
                  '0px 4px 1px 0px rgba(0,0,0,0.2), 0px 0px 1px 0px rgba(0,0,0,0.14), 0px -8px 10px 0px rgba(0,0,0,0.12) !important',
              },
              '& .MuiCheckbox-root': {
                color: `#294bd6 !important`,
                '.dark &': {
                    color: `#8ab4f8 !important`,
                }
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none !important',
              },
              '& .MuiTablePagination-displayedRows': {
                color: 'white', // Default text color is black, so we need to specify white for dark mode
                '.dark &': {
                    color: '#fff', // White text color in dark mode
                }
              },
              '& .MuiTablePagination-selectLabel': {
                color: 'white', // Default text color is black, so we need to specify white for dark mode
                '.dark &': {
                    color: '#fff', // White text color in dark mode
                }
              },
              '& .MuiSelect-select': {
                color: 'white', // Default text color is black, so we need to specify white for dark mode
                '.dark &': {
                    color: '#fff', // White text color in dark mode
                    
                },
                '&.Mui-focused': {
                    backgroundColor: 'transparent', // Remove the default background on focus
                },
                '&:focus': {
                    backgroundColor: 'transparent', // Remove the default background on focus
                },
                '&:hover': {
                  backgroundColor: 'transparent', // Remove the default background on hover
                },
              },
              '& .MuiTablePagination-selectIcon': {
                color: 'white',
                '.dark &': {
                    color: '#fff', // White icon color in dark mode
                }
              },
              '& .MuiTablePagination-actions button': {
                color: 'white',
                '.dark &': {
                    color: '#fff', // White icon color in dark mode
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // Add a subtle hover effect
                  '.dark &': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Add a subtle hover effect in dark mode
                  }
                }
              },
              '& .MuiTablePagination-toolbar': {
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                '.dark &': {
                  borderTop: '1px solid rgba(224, 224, 224, 0.2)', // Lighter border in dark mode
                }
              },
              '& .MuiTablePagination-root': {
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                '.dark &': {
                  borderTop: '1px solid rgba(224, 224, 224, 0.2)', // Lighter border in dark mode
                }
              },
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              checkboxSelection
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                columnsPanel: {
                  disableHideAllButton: true,
                  disableShowAllButton: true,
                },
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              isCellEditable={() => false}
            />
            {!!snackbar && (
              <Snackbar
                open
                onClose={handleCloseSnackbar}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert {...snackbar} onClose={handleCloseSnackbar} />
              </Snackbar>
            )}
          </Box>
        </div>
      </div>
    </div>
  );
};

export default ManageCarPage;