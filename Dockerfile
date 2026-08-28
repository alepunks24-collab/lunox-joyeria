FROM php:8.2-apache

# Copiar todos los archivos del proyecto al servidor web
COPY . /var/www/html/

# Habilitar mod_rewrite para Apache
RUN a2enmod rewrite

# Exponer el puerto 80
EXPOSE 80
