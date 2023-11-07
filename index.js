const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('register');
    }
    next();
}
const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE
// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `user_name`, credit FROM `nusers` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('home',{
            name:rows[0].user_name,
            credit:rows[0].credit
        });
    });
    
});
app.get('/premium', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `user_name`, credit FROM `nusers` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('premium',{
            name:rows[0].user_name,
            credit:rows[0].credit
        });
    });
    
});

// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `nusers` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `nusers`(`user_name`,`email`,`password`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE


// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT email FROM nusers WHERE email=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM nusers WHERE email =?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/');
                }
                else{
                    res.render('register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

//Play music by song_id
app.get('/playing', (req, res) => {
    const song_id = req.query.song_id;
    const songLinks = [];

    const promises = [];
    for (let i = song_id; i < song_id + 10; i++) {
        const promise = dbConnection.execute("SELECT songLink FROM nsongs WHERE song_id = ?", [i])
            .then(([rows]) => {
                if (rows.length > 0) {
                    songLinks.push(rows[0].songLink);
                }
            })
            .catch(err => {
                console.log(err);
                res.send('An error occurred while fetching the song data.');
            });
        promises.push(promise);
    }

    Promise.all(promises)
        .then(() => {
            res.render('playing', { 
                name: 'art',
                songLink1: songLinks[0] || "",
                songLink2: songLinks[1] || "",
                songLink3: songLinks[2] || "",
                songLink4: songLinks[3] || "",
                songLink5: songLinks[4] || "",
                songLink6: songLinks.length > 5 ? songLinks[5] : "",
                songLink7: songLinks.length > 6 ? songLinks[6] : "",
                songLink8: songLinks.length > 7 ? songLinks[7] : "",
                songLink9: songLinks.length > 8 ? songLinks[8] : "",
                songLink10: songLinks.length > 9 ? songLinks[9] : "",
                songLink11: songLinks[10] || "",
                songLink12: songLinks[11] || "",
                songLink13: songLinks[12] || "",
                songLink14: songLinks[13] || "",
                songLink15: songLinks[14] || "",
                songLink16: songLinks.length > 15 ? songLinks[15] : "",
                songLink17: songLinks.length > 16 ? songLinks[16] : "",
                songLink18: songLinks.length > 17 ? songLinks[17] : "",
                songLink19: songLinks.length > 18 ? songLinks[18] : "",
                songLink20: songLinks.length > 19 ? songLinks[19] : "",
                songLink21: songLinks[20] || "",
                songLink22: songLinks[21] || "",
                songLink23: songLinks[22] || "",
                songLink24: songLinks[23] || "",
                songLink25: songLinks[24] || "",
                song_id: song_id 
            });
            
            
        })
        .catch(err => {
            console.log(err);
            res.send('An error occurred while fetching the song data.');
        });
});

app.get('/playPreM', (req, res) => {
    const album_id = req.query.album_id;
    const albumLinks = []; // Corrected variable name from songLinks to albumLinks

    const promises = [];
    for (let i = album_id; i < album_id + 1; i++) {
        const promise = dbConnection.execute("SELECT albumLink FROM nalbums WHERE album_id = ? ", [i]) // Changed album_id to i
            .then(([rows]) => {
                if (rows.length > 0) {
                    albumLinks.push(rows[0].albumLink);
                }
            })
            .catch(err => {
                console.log(err);
                res.send('An error occurred while fetching the song data.');
            });
        promises.push(promise);
    }

    Promise.all(promises)
        .then(() => {
            // Check if albumLinks has a value or not and then render the playing page with the received data
            if (albumLinks.length > 0) {
                res.render('playPreM', { 
                    name: 'art',
                    albumLink1: albumLinks[0] || "" // Corrected variable name from albumLinksLink1 to albumLink1
                    // Add other data you want to send to other playing pages as needed
                });
            } else {
                res.send('No song data found for the provided album ID.');
            }
        })
        .catch(err => {
            console.log(err);
            res.send('An error occurred while fetching the song data.');
        });
});



//หัก credit premium
app.get('/premium', (req, res) => {
    const credit = req.query.credit;
    const updateQuery = 'UPDATE nusers SET credit = credit - ?';
    connection.query(updateQuery, [credit], (error, results, fields) => {
      if (error) {
        console.error('Error updating credit:', error);
        res.status(500).send('An error occurred while updating credit.');
      } else {
        console.log('Credit updated successfully.');
        res.send(`Credit updated successfully. Updated credit: ${credit}`);
        res.render('premium')
      }
    });
  });




app.get('/playing',(req,res)=>{

    res.render('playing');
});

app.get('/playPreM',(req,res)=>{

    res.render('playPreM');
});

app.get('/premium',(req,res)=>{

    res.render('premium');
});

app.get('/home',(req,res)=>{
    res.render('home');
});

// ดึงข้อมูลลิ้งค์เพลงจาก MySQL Database

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});



app.listen(3000, () => console.log("Server is Running..."));