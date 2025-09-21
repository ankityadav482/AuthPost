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

const jwt = require('jsonwebtoken');
const post = require('./models/post');

app.get('/',function(req,res){
    res.render('index');
})

app.get('/login', function(req,res){
    res.render('login');
})

app.get('/profile',isloggedIn, function(req,res){
    userModel.findOne({email:req.user.email}).then(function(user){
        user.populate("posts")
        .then(function(user){
        if (!user) return res.status(404).send("User not found");
        res.render('profile', { user });
    })
    })
})

app.get('/like/:id', isloggedIn, function(req,res){
    postModel.findOne({_id: req.params.id})
    .populate("user")
    .then(function(post){
        if(!post) return res.status(404).send("Post not found");

        if(post.likes.indexOf(req.user.userid) === -1){
            // like add karo
            post.likes.push(req.user.userid);
        } else {
            // like remove karo (unlike)
            post.likes.splice(post.likes.indexOf(req.user.userid), 1);
        }

        post.save().then(function(){
            res.redirect('/profile');
        });
    })
});


app.get('/edit/:id', isloggedIn, function(req,res){
    postModel.findOne({_id: req.params.id})
    .populate("user")
    .then(function(post){
        if (!post) return res.status(404).send("Post not found");
        res.render('edit', { post });
    })
});

app.post('/update/:id', isloggedIn, function(req,res){
    postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content})
    .then(function(post){
        if (!post) return res.status(404).send("Post not found");
        res.redirect('/profile');
    })
});



app.post('/post', isloggedIn, function(req, res) {
    let { content } = req.body;

    userModel.findOne({ email: req.user.email })
    .then(function(user) {
        if (!user) return res.status(404).send("User not found");
        postModel.create({
            user: user._id,
            content
        })
        .then(function(post) {
            user.posts.push(post._id);
            user.save()
            .then(function() {
                res.redirect('/profile');
            })
        })  
    })
});


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
                res.status(200).redirect("/profile");
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
    if(req.cookies.token==="") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;
        next()
    }
}

app.listen(3000,function(){
    console.log("run....");
})