import Modal from 'react-bootstrap/Modal';
import "./ImageViewer.css"

function ImageViewer(props){
    var showModal = props.image != null


    return <Modal size="xl" fullscreen="md-down" centered show={showModal} onHide={() => { props.setImage(null) }} >

                <button className="closeButton" onClick={() => { props.setImage(null) }}>X</button>

                <div className='modalMediaContainer'>
                    <img className='modalMedia' src={props?.image?.image_url}  />
                </div>
                <h3>{props?.image?.location_name}</h3>
           </Modal>


}
export default ImageViewer