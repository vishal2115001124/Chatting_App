const Express=require('express');
const { isLoggedin } = require('../Controllers/authController');
const Route=Express.Router();
const meetingModel=require("./../Models/meeting");
const UsersModel=require("./../Models/users");
const institutionModel = require('../Models/institutionModel');
const sharedFileModel=require("../Models/sharedFileModel");




Route.get("/",(req,res)=>{ 
            res.status(200).render('index.ejs',{title:"Home"});
});
Route.get("/login",(req,res)=>{
    res.status(200).render("login.ejs",{title:"Login"});
})
 
Route.get("/signup",async(req,res)=> {
    
    res.status(200).render("signup.ejs",{title:"Signup"});
})

Route.use(isLoggedin); 



Route.get("/meeting/projectIGI",(req,res)=>{
    const token=req.query.token;
    if(!token){
       return res.redirect("/dashboard/meeting");
    }
    res.render("meetingPortal.ejs",{title:"joined",roomName:token,user:req.session.user});
})


Route.get("/notverified",(req,res)=>{
    res.render("notActivated.ejs");
});
Route.get("/dashboard",async (req,res)=>{
    let user = await UsersModel.findById(req.session.user.id)
    .populate('InstitutionDetails') 
    .populate('ownMeetings');
    let meetings=(await meetingModel.find({})).length;
    req.session.user=user;
    // console.log(user);
    const userCount=(await institutionModel.find({institution:user.InstitutionDetails[0].institution})).length;

    res.render("dashboard.ejs",{title:"Dashboard",user:user,meetings,totalUsers:userCount});
});

Route.get("/dashboard/meeting",async (req,res)=>{
    const user=req.session.user;
    let meetings=await meetingModel.find({}).populate('createdBy');
    const urMeetings=meetings.filter(ele=>ele.createdBy.id==user.id);
    meetings=meetings.filter(ele=>ele.createdBy.id!=user.id);
   // console.log(urMeetings);
    res.status(200).render("meeting.ejs",{title:"Meeting",user,urMeetings,meetings});
})

Route.get("/dashboard/chats",async (req,res)=>{
    const user=req.session.user;
    const users=await UsersModel.find({});
    res.status(200).render("chat.ejs",{title:"Chatting",user,users,sender:{id:""}});
});

Route.get("/dashboard/profile/update-password",(req,res)=>{

    res.status(200).render("resetpassword.ejs",{title:"resetPassword",id:req.session.user.id});
});

Route.get("/dashboard/chats/:id",async (req,res)=>{
    const {id}=req.params;
     const user=req.session.user;
     const users=await UsersModel.find({});
     const sender=()=>{
        for(let i of users){  
            if(i.id==id) 
                return i;
        }
        return undefined;
    }
    if(!sender()){
       return res.redirect("/dashboard/chats");
    }
    res.status(200).render("chat.ejs",{title:"Chatting",user,users,sender:sender()});
});

Route.get("/dashboard/allmeeting",async (req,res)=>{
    const user=req.session.user;
    res.status(200).render("AllMeeting.ejs",{title:"Schedules",user});
});

//Route.use(isLoggedin);
Route.get("/dashboard/profile",async (req,res)=>{
    const user=req.session.user;
    res.status(200).render("profile.ejs",{title:"Profile",user});
});

Route.get("/dashboard/profile/filldetails",(req,res)=>{
    res.status(200).render('form.ejs',{title:"Profile",user:req.session.user});
});

Route.get("/dashboard/files",async (req,res)=>{
    const AllFiles=await sharedFileModel.find({ $or: [{ sender: req.session.user.id },{sender:"super--chats"},{receiver:"super--chats"} ,{ receiver: req.session.user.id }] });
    res.render("files.ejs",{title:"Files",user:req.session.user,files:AllFiles});
})

module.exports=Route;