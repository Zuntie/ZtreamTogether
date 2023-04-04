window.onload = function () {
    const exampleModal = document.getElementById('exampleModal')
    if (exampleModal) {
        exampleModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            const type = button.getAttribute('data-bs-whatever')
            const streamButton = document.getElementById('footerprimary');
            const modalTitle = exampleModal.querySelector('.modal-title')

            if (type == 'Create Stream') {
                modalTitle.textContent = `${type}`
                exampleModal.querySelector('#urlforwhat').textContent = 'URL to stream'
                exampleModal.querySelector('#footerprimary').textContent = 'Stream'
                exampleModal.querySelector('#streaminput').setAttribute('placeholder', 'https://example.com')

            } else if (type == 'Join Stream') {
                modalTitle.textContent = `${type}`
                exampleModal.querySelector('#footerprimary').textContent = 'Join'
                exampleModal.querySelector('#urlforwhat').textContent = 'INVITE ID'
                exampleModal.querySelector('#streaminput').setAttribute('placeholder', 'ExAmPlE')
            }

            streamButton.addEventListener('click', () => {
                console.log(streamButton.textContent)
                if (streamButton.textContent == 'Stream') {
                    const streamURL = exampleModal.querySelector('#streaminput').value;
                    console.log(streamURL)
                    const data = {
                        streamURL
                    }
                    console.log(data)

                    fetch('/stream/new', {
                        method: "POST",
                        body: JSON.stringify(data),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }).then(response => response.json()).then(data => {
                        console.log(data)

                        const url = `/stream/${data.uniqueID}`;
                        window.location.href = url;

                    }).catch(error => console.error(error));
                } else if (streamButton.textContent == 'Join') {
                    const streamId = exampleModal.querySelector('#streaminput').value;
                    console.log(streamId)
                    if (streamId) {
                        window.location.href = '/stream/' + streamId
                    }
                }
            });
        })
    }
}