import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

const CATEGORIES = [
  'Textbooks',
  'Electronics',
  'Lab & Engineering Gears',
  'Hostel Essentials',
  'Clothing',
  'Other'
];


function ProductForm({ onProductAdded }) {

  const [formData, setFormData] = useState({
    title:'',
    price:'',
    description:'',
    category:'Textbooks'
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };




  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setMessage('');



    const savedUser = JSON.parse(
      localStorage.getItem('user')
    );


    const data = new FormData();


    data.append(
      'seller_id',
      savedUser?.id || 1
    );


    data.append(
      'title',
      formData.title
    );


    data.append(
      'price',
      parseFloat(formData.price)
    );


    data.append(
      'description',
      formData.description
    );


    data.append(
      'category',
      formData.category
    );


    if(imageFile){
      data.append('image', imageFile);
    }



    try {


      await axios.post(
        `${API_URL}/api/products`,
        data
      );


      setMessage(
        'Product uploaded to CampuSwap! 🎉'
      );


      setFormData({
        title:'',
        price:'',
        description:'',
        category:'Textbooks'
      });


      setImageFile(null);


      document.getElementById(
        'imageInput'
      ).value = '';


      onProductAdded();



    } catch(err){

      console.log(err);

      setMessage(
        'Failed to post product.'
      );


    } finally {

      setLoading(false);

    }

  };




  return (

    <div
      style={{
        backgroundColor:'#fff',
        padding:'25px',
        borderRadius:'8px',
        border:'1px solid #ddd',
        marginBottom:'30px'
      }}
    >

      <h3 style={{
        margin:'0 0 15px',
        color:'#333'
      }}>
        List an Item for Sale
      </h3>



      <form onSubmit={handleSubmit}>


        <div
          style={{
            display:'flex',
            gap:'15px',
            marginBottom:'15px',
            flexWrap:'wrap'
          }}
        >


          <div style={{flex:2,minWidth:'200px'}}>

            <label>Item Title</label>

            <input

              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required

              style={{
                width:'100%',
                padding:'10px'
              }}

            />

          </div>




          <div style={{flex:1,minWidth:'100px'}}>

            <label>Price (₹)</label>

            <input

              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required

              style={{
                width:'100%',
                padding:'10px'
              }}

            />

          </div>




          <div style={{flex:1,minWidth:'150px'}}>

            <label>Category</label>

            <select

              name="category"
              value={formData.category}
              onChange={handleChange}

              style={{
                width:'100%',
                padding:'10px'
              }}

            >

              {CATEGORIES.map(cat => (

                <option
                  key={cat}
                  value={cat}
                >
                  {cat}
                </option>

              ))}

            </select>


          </div>


        </div>





        <div style={{marginBottom:'15px'}}>

          <label>Product Image</label>

          <input

            id="imageInput"
            type="file"
            accept="image/*"
            onChange={
              (e)=>setImageFile(e.target.files[0])
            }

            required

          />

        </div>




        <div style={{marginBottom:'15px'}}>

          <label>Description</label>


          <textarea

            name="description"
            value={formData.description}
            onChange={handleChange}
            required

            rows="3"

            style={{
              width:'100%',
              padding:'10px'
            }}

          />

        </div>




        <button

          type="submit"

          disabled={loading}

          style={{
            backgroundColor:'#28a745',
            color:'#fff',
            padding:'10px 20px',
            border:'none',
            borderRadius:'4px'
          }}

        >

          {loading ? 'Uploading...' : 'Post Item'}

        </button>


      </form>




      {message && (

        <p style={{
          color:'green'
        }}>
          {message}
        </p>

      )}


    </div>

  );

}


export default ProductForm;