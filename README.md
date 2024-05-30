####

Twitch token url

Go here

id: z8u5u98k474iesky7cof0x4japk8pm
secret: esk1s4rnzdh5427ghsuu84iz8b0lcv

```
https://id.twitch.tv/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=chat:read
```

code: zmy8dbrm2d4c9ku2qetxxfcid9buee
POST to this

```
https://id.twitch.tv/oauth2/token?client_id=CLIENT_ID
    &client_secret=CLIENT_SECRET
    &code=CODE_FROM_LAST_REQUEST
    &grant_type=authorization_code
    &redirect_uri=REDIRECT_URI
```
