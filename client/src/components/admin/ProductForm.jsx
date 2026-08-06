const formDataToSend = new FormData();

formDataToSend.append("name", formData.name);
formDataToSend.append("category", formData.category);
formDataToSend.append("subcategory", formData.subcategory);
formDataToSend.append("price", formData.price);
formDataToSend.append("quantity", formData.quantity);
formDataToSend.append("description", formData.description);
formDataToSend.append("ageGroup", formData.ageGroup);
formDataToSend.append("brand", formData.brand);
formDataToSend.append("sku", formData.sku);
formDataToSend.append("weight", formData.weight);
formDataToSend.append("status", formData.status);
formDataToSend.append("model3d", formData.model3d);

for (let i = 0; i < images.length; i++) {
  formDataToSend.append("images", images[i]);
}

await axios.post(
  "http://localhost:5000/api/products",
  formDataToSend,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);