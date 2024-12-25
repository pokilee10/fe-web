function Validation(values) {
    let error = {}
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/


    if(values.name === ""){
        error.name = "This field cannot be empty"
    }
    else if(!email_pattern.test(values.name)){
        error.name = "Your email address not exist"
    }else {
        error.name = ""
    }

    if(values.password === "") {
         error.password = "This field cannot be empty"
    }
    else if(!password_pattern.test(values.password)){
         error.password = "Password must have at least 1 lowercase, 1 uppercase letter, 1 number and longer than 8"
    } 
    else{
         error.password = ""
    }

    if(values.confpassword === "") {
        error.confpassword = "This field cannot be empty"
    }
    else if(values.confpassword != values.password){
        error.confpassword = "Confirm password didn't match"
    } 
    else{
        error.confpassword = ""
    }

    return error;
}

export default Validation;