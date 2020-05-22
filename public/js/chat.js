const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const imageMessageTemplate = document.querySelector('#image-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('imageMessage' , (message) => {  
    console.log(message)
    const arrayBufferView = new Uint8Array( message.image );
    const blob = new Blob([ arrayBufferView ], { type: "image/jpeg" } );
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL( blob );

    const html = Mustache.render(imageMessageTemplate , {
        username : message.username,
        image :  imageUrl,
        createdAt : moment(message.createdAt).format('h:mm a')
    }) 
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})









socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})


const $imageForm = document.querySelector('#image-form')
const $imageFormButton = document.querySelector('#image-form-button')
const input = document.querySelector('input[type="file"]')
$imageForm.addEventListener('submit' , (e) => { 
    e.preventDefault() 
    $imageFormButton.setAttribute('disabled' , 'disabled')
    const image = input.files[0]  
    console.log(image)
    // validation
    const imageExtension = image.name.substring(image.name.lastIndexOf(".")+1, image.name.length)
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'bmp']
    if (!allowedExtensions.includes(imageExtension)) {
        $imageForm.reset()
        console.log("extension validation")
        $imageFormButton.removeAttribute('disabled')
        return alert("File not allowed")
    } 

    if (image.size > 10485760) {
        $imageForm.reset()
        console.log("size validation")
        $imageFormButton.removeAttribute('disabled')   
        return alert("File size must be less than 10mb")
    }

    socket.emit('sendImage' , image , (error) => {
        $imageFormButton.removeAttribute('disabled')
        if (error) {
            return console.log(error)
        } 
        console.log('Image delivered !! ')
        $imageForm.reset()
    })

})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
}) 




 