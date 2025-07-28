module.exports = {
    resolve: {
      extensions: ['.web.js', '.js'],
      alias: {
        'react-native$': 'react-native-web',  // Alias react-native to react-native-web
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
          },
          exclude: /node_modules/,
        },
      ],
    },
  };
  