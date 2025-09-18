const express =  require('express')
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.set('view engine','ejs');
const path =  require('path')
app.use(express.static(path.join(__dirname,"public")));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const userModel =  require('./models/user');
const postModel =  require('./models/post');

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

app.get('/',function(req,res){
    res.render('index');
})

app.get('/login', function(req,res){
    res.render('login');
})

app.get('/profile',isloggedIn, function(req,res){
    console.log(req.user);
    res.render('login');
})

app.get('/logout',function(req,res){
    res.cookie("token","");
    res.redirect('/login');
})

app.post('/login',function(req,res){
    let{email,password} = req.body;

    userModel.findOne({email}).then(function(user){
        if(!user) return res.status(500).send("Something is Wrong..");

        bcrypt.compare(password,user.password,function(err,result){
            if(result){
                let token = jwt.sign({email:email , userid: user._id},"shhhh");
                res.cookie("token",token);
                res.status(200).send("you can login");
            }
            else{
                res.redirect("/login");
            }
        })
   
    })
})

app.post('/register',function(req,res){
    let{email,username,password,name,age} = req.body;

    userModel.findOne({email}).then(function(user){
        if(user) return res.status(500).send("User already register");

   
    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(password,salt,function(err,hash){
            userModel.create({
                username,
                email,
                password:hash,
                age,
                name
            }).then(function(CreateUser){
                // res.send(CreateUser);
                let token = jwt.sign({email:email , userid: CreateUser._id},"shhhh");
                res.cookie("token",token);
                res.send("registered");
            })
        })
    })
     })
})

function isloggedIn(req,res,next){
    if(req.cookies.token==="") res.send("You must be looged in");
    else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;
        next()
    }
}

app.listen(3000,function(){
    console.log("run....");
})