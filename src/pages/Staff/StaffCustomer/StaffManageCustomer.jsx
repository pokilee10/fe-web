import React, { useEffect, useState } from "react";
import SideBarStaff from "../../../layouts/components/SideBarStaff";
import Box from "@mui/material/Box";
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import CustomerModalForm from "./CustomerForm";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import WarningIcon from "@mui/icons-material/Warning";
import { cdmApi } from "../../../misc/cdmApi";
import axios from "axios";
//Main Page
const StaffManageCustomerPage = () => {
  const [rows, setRows] = useState([]);
  const [dataChangeFlag, setDataChangeFlag] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [rowToEdit, setRowToEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await cdmApi.getAllUsers(1000);
        const filtedRoleData = response.data.content.filter(
          (row) => row.role === "CUSTOMER"
        );
        
        const addedIndexData = filtedRoleData.map((row, index) => ({
          ...row,
          index: index + 1,
        }));
        setRows(addedIndexData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [dataChangeFlag]);

  const handleCloseSnackbar = () => setSnackbar(null);

  const handleSubmit = (newFormState) => {
    const message =
      rowToEdit === null
        ? "Do you really want to create a new customer?"
        : "Do you really want to update the customer's information?";
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
          formData.append("file", rowToEdit.avatar);
          formData.append("upload_preset", "xuanlinh");
  
          const resUpload = await axios.post(
            "https://api.cloudinary.com/v1_1/dqfhfd7ts/image/upload",
            formData
          );
          
          const updatedFormState = { ...rowToEdit, avatar: resUpload.data.secure_url };
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
      formState.role = "CUSTOMER";
      formState.password = "Newuser123";
      const response = await cdmApi.createCustomer(formState);
      setRows([...rows, response.data]);
      setSnackbar({
        children: "Customer created successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      setSnackbar({ children: "Couldn't create customer", severity: "error" });
    } finally {
      setDataChangeFlag(!dataChangeFlag);
      setModalOpen(false);
    }
  };

  const handleUpdateApi = async (formState) => {
    try {
      const response = await cdmApi.updateUser(formState);
      setRows(
        rows.map((row) => (row.id === formState.id ? response.data : row))
      );
      setSnackbar({
        children: "Customer updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      setSnackbar({ children: "Couldn't update customer", severity: "error" });
    } finally {
      setDataChangeFlag(!dataChangeFlag);
      setModalOpen(false);
      setRowToEdit(null);
    }
  };

  const handleDeleteApi = async () => {
    try {
      await cdmApi.deleteUser(deletingId);
      setRows(rows.filter((row) => row.id !== deletingId));
      setSnackbar({
        children: "Customer deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      setSnackbar({ children: "Couldn't delete customer", severity: "error" });
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
    setPopupMessage("Do you really want to delete this customer?");
    setPopupOpen(true);
  };

  const columns = [
    {
      field: "index",
      headerName: "ID",
      width: 50,
      renderCell: (params) => params.row.index,
    },
    {
      field: "avatar",
      headerName: "Avatar",
      width: 120,
      renderCell: (params) => (
        <div>
          <img
            className="rounded-full w-10 h-10 object-cover"
            src={
              params.row.avatar
                ? params.row.avatar
                : "https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg"
            }
            alt="avatar"
          />
        </div>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      width: 180,
    },
    {
      field: "phone_number",
      headerName: "Phone Number",
      width: 160,
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
    },
    {
      field: "address",
      headerName: "Address",
      width: 250,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
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
    <div className="flex bg-white dark:bg-gray-900">
      <SideBarStaff />
      {modalOpen && (
        <CustomerModalForm
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
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Customer
          </p>
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
              "& .MuiDataGrid-root": {
                border: "none",
                backgroundColor: "white", // Background color in light mode
                borderRadius: "8px",
                ".dark &": {
                  backgroundColor: "#272727", // Background color in dark mode
                },
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
                fontSize: "12px",
                color: "black", // Text color in light mode
                ".dark &": {
                  color: "white", // Text color in dark mode
                },
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#607286", // Background color in light mode
                color: "#fff",
                borderBottom: "none",
                fontSize: "14px",
                borderRadius: "8px 8px 0 0",
                ".dark &": {
                  backgroundColor: "#474747", // Background color in dark mode
                },
              },
              "& .MuiDataGrid-footerContainer": {
                borderRadius: "0 0 8px 8px",
              },
              "& .MuiDataGrid-virtualScroller": {},
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell": {
                boxShadow:
                  "0px 4px 1px 0px rgba(0,0,0,0.2), 0px 0px 1px 0px rgba(0,0,0,0.14), 0px -8px 10px 0px rgba(0,0,0,0.12) !important",
              },
              "& .MuiCheckbox-root": {
                color: `#294bd6 !important`, // Checkbox color in light mode
                ".dark &": {
                  color: `#8ab4f8 !important`, // Checkbox color in dark mode
                },
              },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none !important",
              },
              "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
                {
                  outline: "none !important",
                },
              // Light mode styles for pagination elements:
              "& .MuiTablePagination-displayedRows": {
                color: "black", // Text color in light mode
                ".dark &": {
                  color: "#fff", // Text color in dark mode
                },
              },
              "& .MuiTablePagination-selectLabel": {
                color: "black", // Text color in light mode
                ".dark &": {
                  color: "#fff", // Text color in dark mode
                },
              },
              "& .MuiSelect-select": {
                color: "black", // Text color in light mode
                "&.Mui-focused": {
                  backgroundColor: "transparent",
                },
                "&:focus": {
                  backgroundColor: "transparent",
                },
                "&:hover": {
                  backgroundColor: "transparent",
                },
                ".dark &": {
                  color: "#fff", // Text color in dark mode
                },
              },
              "& .MuiTablePagination-selectIcon": {
                color: "black", // Icon color in light mode
                ".dark &": {
                  color: "#fff", // Icon color in dark mode
                },
              },
              "& .MuiTablePagination-actions button": {
                color: "black", // Button color in light mode
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.1)", // Hover effect in light mode
                },
                ".dark &": {
                  color: "#fff", // Button color in dark mode
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)", // Hover effect in dark mode
                  },
                },
              },
              "& .MuiTablePagination-toolbar": {
                borderTop: "1px solid rgba(224, 224, 224, 1)", // Border in light mode
                ".dark &": {
                  borderTop: "1px solid rgba(224, 224, 224, 0.2)", // Border in dark mode
                },
              },
              "& .MuiTablePagination-root": {
                borderTop: "1px solid rgba(224, 224, 224, 1)", // Border in light mode
                ".dark &": {
                  borderTop: "1px solid rgba(224, 224, 224, 0.2)", // Border in dark mode
                },
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
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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

export default StaffManageCustomerPage;